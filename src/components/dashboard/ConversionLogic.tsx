import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertSybaseToOracle, generateConversionReport } from '@/utils/conversionUtils';
import { supabase } from '@/integrations/supabase/client';
import { ConversionResult, ConversionReport } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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
  selectedAiModel: string
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

    setConvertingFileIds([fileId]);
    setIsConverting(true);
    
    try {
      const result = await convertSybaseToOracle(file, selectedAiModel);
      
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

      await supabase.from('migration_files').update({
        conversion_status: mapConversionStatus(result.status),
        converted_content: result.convertedCode
      }).eq('file_name', file.name);
    } catch (error) {
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
    } finally {
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults]);

  const handleConvertAllByType = useCallback(async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    const typeFiles = files.filter(f => f.type === type && f.conversionStatus === 'pending');
    if (typeFiles.length === 0) return;

    setIsConverting(true);
    
    for (const file of typeFiles) {
      setConvertingFileIds([file.id]);
      try {
        const result = await convertSybaseToOracle(file, selectedAiModel);
        
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

        await supabase.from('migration_files').update({
          conversion_status: mapConversionStatus(result.status),
          converted_content: result.convertedCode
        }).eq('file_name', file.name);
      } catch (error) {
        console.error(`Conversion failed for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, conversionStatus: 'failed' } : f
        ));
      }
    }
    
    setConvertingFileIds([]);
    setIsConverting(false);
  }, [files, selectedAiModel, setFiles, setConversionResults]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);

    // Helper to process a batch of files in parallel
    const processBatch = async (batch: FileItem[]) => {
      setConvertingFileIds(prev => [...prev, ...batch.map(f => f.id)]);
      await Promise.all(
        batch.map(async (file) => {
          try {
            const result = await convertSybaseToOracle(file, selectedAiModel);

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

            await supabase.from('migration_files').update({
              conversion_status: mapConversionStatus(result.status),
              converted_content: result.convertedCode
            }).eq('file_name', file.name);
          } catch (error) {
            console.error(`Conversion failed for ${file.name}:`, error);
            setFiles(prev => prev.map(f =>
              f.id === file.id ? { ...f, conversionStatus: 'failed' } : f
            ));
          } finally {
            setConvertingFileIds(prev => prev.filter(id => id !== file.id));
          }
        })
      );
    };

    // Process in batches of 5
    for (let i = 0; i < pendingFiles.length; i += 5) {
      const batch = pendingFiles.slice(i, i + 5);
      await processBatch(batch);
    }

    setIsConverting(false);
  }, [files, selectedAiModel, setFiles, setConversionResults]);

  const handleFixFile = useCallback(async (fileId: string) => {
    setIsConverting(true);
    setConvertingFileIds([fileId]);
    try {
      const fileToFix = files.find(file => file.id === fileId);
      if (!fileToFix) {
        console.error('File not found');
        return;
      }
      // Re-run the conversion logic for the failed file
      const result = await convertSybaseToOracle(fileToFix, selectedAiModel);
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
      await supabase.from('migration_files').update({
        conversion_status: mapConversionStatus(result.status),
        converted_content: result.convertedCode
      }).eq('id', fileId);
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
      setConvertingFileIds([]);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, toast, mapConversionStatus]);

  const handleGenerateReport = useCallback(async (): Promise<ConversionReport & { id: string }> => {
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
      id: uuidv4(),
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
  };
};
