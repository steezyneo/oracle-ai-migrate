import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertSybaseToOracle, generateConversionReport } from '@/utils/conversionUtils';
import { supabase } from '@/integrations/supabase/client';
import { ConversionResult, ConversionReport } from '@/types';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: any[];
  issues?: any[];
  performanceMetrics?: any;
}

export const useConversionLogic = (
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  setConversionResults: React.Dispatch<React.SetStateAction<ConversionResult[]>>,
  selectedAiModel: string,
  customPrompt?: string
) => {
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [convertingFileIds, setConvertingFileIds] = useState<string[]>([]);

  const mapConversionStatus = (status: 'success' | 'warning' | 'error'): 'pending' | 'success' | 'failed' => {
    switch (status) {
      case 'success':
      case 'warning':
        return 'success';
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  };

  const handleConvertFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setConvertingFileIds([...convertingFileIds, fileId]);
    setIsConverting(true);
    
    try {
      const result = await convertSybaseToOracle(file, selectedAiModel, customPrompt);
      
      const conversionResult: ConversionResult = {
        id: result.id,
        originalFile: {
          id: file.id,
          name: file.name,
          content: file.content,
          type: file.type,
          status: 'pending'
        },
        convertedCode: result.convertedCode,
        issues: result.issues,
        dataTypeMapping: result.dataTypeMapping,
        performance: result.performance,
        status: result.status
      };
      
      setConversionResults(prev => [...prev, conversionResult]);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              conversionStatus: mapConversionStatus(result.status),
              convertedContent: result.convertedCode,
              dataTypeMapping: result.dataTypeMapping,
              issues: result.issues,
              performanceMetrics: result.performance
            }
          : f
      ));

               // Update existing migration_files record with conversion results
         await supabase.from('migration_files').update({
           conversion_status: mapConversionStatus(result.status),
           converted_content: result.convertedCode,
           error_message: result.issues?.map(i => i.description).join('; ') || null,
           data_type_mapping: result.dataTypeMapping || null,
           performance_metrics: result.performance || null,
           issues: result.issues || null,
         }).eq('id', file.id);
    } catch (error) {
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
      
      // Update status to failed in database
      await supabase.from('migration_files').update({
        conversion_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }).eq('id', file.id);
    } finally {
      setConvertingFileIds(convertingFileIds.filter(id => id !== fileId));
      setIsConverting(false);
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds]);

  const handleConvertAllByType = useCallback(async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    const typeFiles = files.filter(f => f.type === type && f.conversionStatus === 'pending');
    if (typeFiles.length === 0) return;

    setIsConverting(true);
    
    for (const file of typeFiles) {
      setConvertingFileIds([...convertingFileIds, file.id]);
      try {
        const result = await convertSybaseToOracle(file, selectedAiModel, customPrompt);
        
        const conversionResult: ConversionResult = {
          id: result.id,
          originalFile: {
            id: file.id,
            name: file.name,
            content: file.content,
            type: file.type,
            status: 'pending'
          },
          convertedCode: result.convertedCode,
          issues: result.issues,
          dataTypeMapping: result.dataTypeMapping,
          performance: result.performance,
          status: result.status
        };
        
        setConversionResults(prev => [...prev, conversionResult]);
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                conversionStatus: mapConversionStatus(result.status),
                convertedContent: result.convertedCode,
                dataTypeMapping: result.dataTypeMapping,
                issues: result.issues,
                performanceMetrics: result.performance
              }
            : f
        ));

        // Update existing migration_files record with conversion results
        await supabase.from('migration_files').update({
          conversion_status: mapConversionStatus(result.status),
          converted_content: result.convertedCode,
          error_message: result.issues?.map(i => i.description).join('; ') || null,
          data_type_mapping: result.dataTypeMapping || null,
          performance_metrics: result.performance || null,
          issues: result.issues || null,
        }).eq('id', file.id);
      } catch (error) {
        console.error(`Conversion failed for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, conversionStatus: 'failed' } : f
        ));
        
        // Update status to failed in database
        await supabase.from('migration_files').update({
          conversion_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }).eq('id', file.id);
      } finally {
        setConvertingFileIds(convertingFileIds.filter(id => id !== file.id));
      }
    }
    
    setConvertingFileIds([]);
    setIsConverting(false);
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    const concurrencyLimit = 10; // Increased from 4 to 10
    let currentIndex = 0;
    const results: any[] = [];
    let running: Promise<void>[] = [];
    let convertingIds = new Set<string>();

    // Helper to process the next file in the queue
    const runNext = async () => {
      if (currentIndex >= pendingFiles.length) return;
      const file = pendingFiles[currentIndex++];
      convertingIds.add(file.id);
      setConvertingFileIds(Array.from(convertingIds));
      try {
        console.log(`[CONVERT] Starting: ${file.name}`);
        const result = await convertSybaseToOracle(file, selectedAiModel, customPrompt, true);
        // REMOVE: Do not update migration_files in the database here
        // await supabase.from('migration_files').update({
        //   conversion_status: mapConversionStatus(result.status),
        //   converted_content: result.convertedCode
        // }).eq('id', file.id);
        results.push({ fileId: file.id, result, status: 'success' });
        console.log(`[CONVERT] Success: ${file.name}`);
        // Update UI immediately after conversion
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  conversionStatus: mapConversionStatus(result.status),
                  convertedContent: result.convertedCode,
                  dataTypeMapping: result.dataTypeMapping,
                  issues: result.issues,
                  performanceMetrics: result.performance
                }
              : f
          )
        );
        setConversionResults(prev => [
          ...prev,
          {
            id: result.id,
            originalFile: {
              id: result.originalFile.id,
              name: result.originalFile.name,
              content: result.originalFile.content,
              type: result.originalFile.type,
              status: 'pending'
            },
            convertedCode: result.convertedCode,
            issues: result.issues,
            dataTypeMapping: result.dataTypeMapping,
            performance: result.performance,
            status: result.status
          }
        ]);
      } catch (error) {
        results.push({ fileId: file.id, error, status: 'failed' });
        console.error(`[CONVERT] Error: ${file.name}`, error);
        toast({
          title: 'Conversion Failed',
          description: `Failed to convert ${file.name}: ${error?.message || error}`,
          variant: 'destructive',
        });
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, conversionStatus: 'failed', errorMessage: error?.message || String(error) } : f
          )
        );
      } finally {
        convertingIds.delete(file.id);
        setConvertingFileIds(Array.from(convertingIds));
        // Always try to process the next file if any remain
        if (currentIndex < pendingFiles.length) {
          await runNext();
        }
      }
    };

    // Start initial pool
    for (let i = 0; i < Math.min(concurrencyLimit, pendingFiles.length); i++) {
      running.push(runNext());
    }
    await Promise.all(running);

    setConvertingFileIds([]);
    setIsConverting(false);
    // Optionally, show a summary toast
    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
      toast({
        title: 'Batch Conversion Complete',
        description: `${pendingFiles.length - failedCount} succeeded, ${failedCount} failed.`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } else {
      toast({
        title: 'Batch Conversion Complete',
        description: `All ${pendingFiles.length} files converted successfully!`,
      });
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast]);

  /**
   * Convert only the selected files, up to 3 at a time, running in parallel.
   * As soon as a slot is free, the next file starts, until all are processed.
   */
  const handleConvertSelected = useCallback(async (fileIds: string[]) => {
    console.log('[handleConvertSelected] Called with fileIds:', fileIds);
    // Enforce strict order: use fileIds order, not files array order
    const selectedFiles = fileIds
      .map(id => files.find(f => f.id === id && f.conversionStatus === 'pending'))
      .filter(Boolean) as FileItem[];
    if (selectedFiles.length === 0) return;

    setIsConverting(true);
    const concurrencyLimit = 3;
    let currentIndex = 0;
    const results: any[] = [];
    let running: Promise<void>[] = [];
    let convertingIds = new Set<string>();

    // This pool logic ensures only 3 files are processed at a time, in strict order
    const runNext = async () => {
      if (currentIndex >= selectedFiles.length) return;
      const file = selectedFiles[currentIndex++];
      convertingIds.add(file.id);
      // Set status to 'converting' immediately for UI feedback
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, conversionStatus: 'converting' } : f));
      setConvertingFileIds(Array.from(convertingIds));
      try {
        console.log(`[CONVERT] Starting: ${file.name}`);
        const result = await convertSybaseToOracle(file, selectedAiModel, customPrompt, true);
        // REMOVE: Do not update migration_files in the database here
        // await supabase.from('migration_files').update({
        //   conversion_status: mapConversionStatus(result.status),
        //   converted_content: result.convertedCode
        // }).eq('id', file.id);
        results.push({ fileId: file.id, result, status: 'success' });
        // Show converted code immediately
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  conversionStatus: mapConversionStatus(result.status),
                  convertedContent: result.convertedCode,
                  dataTypeMapping: result.dataTypeMapping,
                  issues: result.issues,
                  performanceMetrics: result.performance
                }
              : f
          )
        );
        setConversionResults(prev => [
          ...prev,
          {
            id: result.id,
            originalFile: {
              id: result.originalFile.id,
              name: result.originalFile.name,
              content: result.originalFile.content,
              type: result.originalFile.type,
              status: 'pending'
            },
            convertedCode: result.convertedCode,
            issues: result.issues,
            dataTypeMapping: result.dataTypeMapping,
            performance: result.performance,
            status: result.status
          }
        ]);
      } catch (error) {
        results.push({ fileId: file.id, error, status: 'failed' });
        console.error(`[CONVERT] Error: ${file.name}`, error);
        toast({
          title: 'Conversion Failed',
          description: `Failed to convert ${file.name}: ${error?.message || error}`,
          variant: 'destructive',
        });
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, conversionStatus: 'failed', errorMessage: error?.message || String(error) } : f
          )
        );
      } finally {
        convertingIds.delete(file.id);
        setConvertingFileIds(Array.from(convertingIds));
        // Always try to process the next file if any remain
        if (currentIndex < selectedFiles.length) {
          await runNext();
        }
      }
    };

    // Start initial pool of up to 3 files
    for (let i = 0; i < Math.min(concurrencyLimit, selectedFiles.length); i++) {
      running.push(runNext());
    }
    await Promise.all(running);

    setConvertingFileIds([]);
    setIsConverting(false);
    // Optionally, show a summary toast
    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
      toast({
        title: 'Selected Conversion Complete',
        description: `${selectedFiles.length - failedCount} succeeded, ${failedCount} failed.`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } else {
      toast({
        title: 'Selected Conversion Complete',
        description: `All ${selectedFiles.length} files converted successfully!`,
      });
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast]);

  const handleFixFile = useCallback(async (fileId: string) => {
    setIsConverting(true);
    setConvertingFileIds([...convertingFileIds, fileId]);
    try {
      const fileToFix = files.find(file => file.id === fileId);
      if (!fileToFix) {
        console.error('File not found');
        return;
      }
      // Re-run the conversion logic for the failed file
      const result = await convertSybaseToOracle(fileToFix, selectedAiModel, customPrompt);
      const conversionResult: ConversionResult = {
        id: result.id,
        originalFile: {
          id: fileToFix.id,
          name: fileToFix.name,
          content: fileToFix.content,
          type: fileToFix.type,
          status: 'pending'
        },
        convertedCode: result.convertedCode,
        issues: result.issues,
        dataTypeMapping: result.dataTypeMapping,
        performance: result.performance,
        status: result.status
      };
      setConversionResults(prev => [...prev, conversionResult]);
      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              conversionStatus: mapConversionStatus(result.status),
              convertedContent: result.convertedCode,
              dataTypeMapping: result.dataTypeMapping,
              issues: result.issues,
              performanceMetrics: result.performance
            }
          : f
      ));
      // REMOVE: Do not update migration_files in the database here
      // await supabase.from('migration_files').update({
      //   conversion_status: mapConversionStatus(result.status),
      //   converted_content: result.convertedCode
      // }).eq('id', fileId);
      toast({
        title: 'File Fixed',
        description: `Successfully fixed ${fileToFix.name}`,
      });
    } catch (error: any) {
      console.error('Error fixing file:', error);
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, conversionStatus: 'failed' } : f));
      toast({
        title: 'Fix Failed',
        description: error.message || 'Failed to fix the file',
        variant: 'destructive',
      });
    } finally {
      setConvertingFileIds(convertingFileIds.filter(id => id !== fileId));
      setIsConverting(false);
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, mapConversionStatus, convertingFileIds, setConvertingFileIds]);

  const handleGenerateReport = useCallback(async (): Promise<ConversionReport> => {
    const conversionResults: ConversionResult[] = files.map(file => ({
      id: file.id,
      originalFile: {
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        status: 'pending'
      },
      convertedCode: file.convertedContent || '',
      issues: file.issues || [],
      performance: file.performanceMetrics || {},
      status: file.conversionStatus === 'success' ? 'success' : 
              file.conversionStatus === 'failed' ? 'error' : 'warning',
      dataTypeMapping: file.dataTypeMapping || [],
    }));

    const reportSummary = generateConversionReport(conversionResults);

    return {
      timestamp: new Date().toISOString(),
      filesProcessed: files.length,
      successCount: files.filter(f => f.conversionStatus === 'success').length,
      warningCount: 0,
      errorCount: files.filter(f => f.conversionStatus === 'failed').length,
      results: conversionResults,
      summary: reportSummary,
    };
  }, [files]);

  return {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
    handleConvertSelected, // Export the new function
  };
};
