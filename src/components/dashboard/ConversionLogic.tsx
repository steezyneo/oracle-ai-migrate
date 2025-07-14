import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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
  customPrompt?: string,
  migrationId?: string // <-- Add migrationId as a parameter
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConverting, setIsConverting] = useState(false);
  const [convertingFileIds, setConvertingFileIds] = useState<string[]>([]);

  // Map conversion status from result to local state
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

  // Create a new migration for failed files (for better tracking)
  const createFailedFileMigration = useCallback(async (fileName: string, originalMigrationId?: string): Promise<string | null> => {
    try {
      const projectName = `Failed: ${fileName}`;
      const { data, error } = await supabase
        .from('migrations')
        .insert({ 
          user_id: user?.id,
          project_name: projectName
        })
        .select()
        .single();
      if (error) {
        console.error('Error creating failed file migration:', error);
        toast({
          title: "Migration Error",
          description: "Failed to create migration for failed file",
          variant: "destructive",
        });
        return null;
      } else {
        toast({
          title: "Failed File Migration Created",
          description: `Created separate migration for failed file: ${fileName}`,
        });
        return data.id;
      }
    } catch (error) {
      // This should be rare, but log for debugging
      console.error('Error creating failed file migration:', error);
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred while creating failed file migration",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.id, toast]);

  // Convert a single file and update state/history
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
      // Upsert into migration_files after successful conversion
      if (migrationId) {
        // Check if file already exists for this migration
        const { data: existing, error: fetchError } = await supabase
          .from('migration_files')
          .select('id')
          .eq('migration_id', migrationId)
          .eq('file_name', file.name)
          .single();
        if (existing && existing.id) {
          // Update existing record
          await supabase.from('migration_files').update({
            converted_content: result.convertedCode,
            conversion_status: mapConversionStatus(result.status),
            error_message: result.issues?.map(i => i.description).join('; ') || null,
            data_type_mapping: result.dataTypeMapping || null,
            performance_metrics: result.performance || null,
            issues: result.issues || null,
          }).eq('id', existing.id);
        } else {
          // Insert new record with both original and converted content
          await supabase.from('migration_files').insert({
            migration_id: migrationId,
            file_name: file.name,
            file_path: file.name,
            file_type: file.type,
            original_content: file.content,
            converted_content: result.convertedCode,
            conversion_status: mapConversionStatus(result.status),
            error_message: result.issues?.map(i => i.description).join('; ') || null,
            data_type_mapping: result.dataTypeMapping || null,
            performance_metrics: result.performance || null,
            issues: result.issues || null,
          });
        }
      } else {
        // No migrationId found, warn but don't break flow
        console.warn('No migrationId found for conversion. File will not be added to history.');
      }
    } catch (error) {
      // Log and update state for failed conversion
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
      // Always use the current migration ID for failed files
      if (migrationId) {
        await supabase.from('migration_files').insert({
          migration_id: migrationId,
          file_name: file.name,
          file_path: file.name,
          file_type: file.type,
          original_content: file.content,
          converted_content: null,
          conversion_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setConvertingFileIds(convertingFileIds.filter(id => id !== fileId));
      setIsConverting(false);
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds, migrationId]);

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

        // Upsert into migration_files after successful conversion
        if (migrationId) {
          await supabase.from('migration_files').insert({
            migration_id: migrationId,
            file_name: file.name,
            file_path: file.name,
            file_type: file.type,
            original_content: file.content,
            converted_content: result.convertedCode,
            conversion_status: mapConversionStatus(result.status),
            error_message: result.issues?.map(i => i.description).join('; ') || null,
            data_type_mapping: result.dataTypeMapping || null,
            performance_metrics: result.performance || null,
            issues: result.issues || null,
          });
        } else {
          console.warn('No migrationId found for conversion. File will not be added to history.');
        }
      } catch (error) {
        console.error(`Conversion failed for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, conversionStatus: 'failed' } : f
        ));
        
        // Save failed file to the same migration (not separate)
        if (migrationId) {
          await supabase.from('migration_files').insert({
            migration_id: migrationId,
            file_name: file.name,
            file_path: file.name,
            file_type: file.type,
            original_content: file.content,
            converted_content: null,
            conversion_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } finally {
        setConvertingFileIds(convertingFileIds.filter(id => id !== file.id));
      }
    }
    
    setConvertingFileIds([]);
    setIsConverting(false);
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds, migrationId]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    const concurrencyLimit = 5; // Only 5 at a time
    let currentIndex = 0;
    const results: any[] = [];
    let running: Promise<void>[] = [];
    let convertingIds = new Set<string>();

    // Helper to delay between retries or between slots
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Helper to convert a file with retry logic
    const convertWithRetry = async (file: FileItem, maxRetries = 3) => {
      let attempt = 0;
      let lastError = null;
      while (attempt < maxRetries) {
        try {
          return await convertSybaseToOracle(file, selectedAiModel, customPrompt, true);
        } catch (error) {
          lastError = error;
          attempt++;
          if (attempt < maxRetries) {
            await delay(2500); // Wait 2.5 seconds before retry
          }
        }
      }
      throw lastError;
    };

    // Helper to process the next file in the queue
    const runNext = async () => {
      if (currentIndex >= pendingFiles.length) return;
      const file = pendingFiles[currentIndex++];
      convertingIds.add(file.id);
      setConvertingFileIds(Array.from(convertingIds));
      try {
        const result = await convertWithRetry(file, 3);
        results.push({ fileId: file.id, result, status: 'success' });
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
        // Upsert into migration_files after successful conversion
        if (migrationId) {
          await supabase.from('migration_files').insert({
            migration_id: migrationId,
            file_name: file.name,
            file_path: file.name,
            file_type: file.type,
            original_content: file.content,
            converted_content: result.convertedCode,
            conversion_status: mapConversionStatus(result.status),
            error_message: result.issues?.map(i => i.description).join('; ') || null,
            data_type_mapping: result.dataTypeMapping || null,
            performance_metrics: result.performance || null,
            issues: result.issues || null,
          });
        } else {
          console.warn('No migrationId found for conversion. File will not be added to history.');
        }
      } catch (error) {
        results.push({ fileId: file.id, error, status: 'failed' });
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, conversionStatus: 'failed', errorMessage: error?.message || String(error) } : f
          )
        );
        
        // Save failed file to database
        if (migrationId) {
          // Check if file already exists for this migration
          const { data: existing, error: fetchError } = await supabase
            .from('migration_files')
            .select('id')
            .eq('migration_id', migrationId)
            .eq('file_name', file.name)
            .single();
          
          if (existing && existing.id) {
            // Update existing record
            await supabase.from('migration_files').update({
              conversion_status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            }).eq('id', existing.id);
          } else {
            // Insert new failed file record
            await supabase.from('migration_files').insert({
              migration_id: migrationId,
              file_name: file.name,
              file_path: file.name,
              file_type: file.type,
              original_content: file.content,
              converted_content: null,
              conversion_status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } finally {
        convertingIds.delete(file.id);
        setConvertingFileIds(Array.from(convertingIds));
        // Always try to process the next file if any remain
        if (currentIndex < pendingFiles.length) {
          await delay(2500); // Wait 2.5 seconds before starting the next file
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
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, migrationId]);

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
        
        // Save failed file to the same migration (not separate)
        if (migrationId) {
          await supabase.from('migration_files').insert({
            migration_id: migrationId,
            file_name: file.name,
            file_path: file.name,
            file_type: file.type,
            original_content: file.content,
            converted_content: null,
            conversion_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
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
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, migrationId]);

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
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, mapConversionStatus, convertingFileIds, setConvertingFileIds, migrationId]);

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

  // Test API connection
  const testAPI = useCallback(async () => {
    console.log('=== TESTING API CONNECTION ===');
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBbhyMmUtGdJhDDUHh7ecI1qsYjR9WQSXU";
    
    console.log('API Key present:', !!GEMINI_API_KEY);
    console.log('API Key length:', GEMINI_API_KEY?.length || 0);
    console.log('API Key preview:', GEMINI_API_KEY?.substring(0, 10) + '...');
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      toast({
        title: "API Key Error",
        description: "Invalid or missing Gemini API key",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Test with a simple prompt
      const testPrompt = 'Say "Hello World"';
      console.log('Testing with prompt:', testPrompt);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        toast({
          title: "API Test Failed",
          description: `HTTP ${response.status}: ${errorText}`,
          variant: "destructive",
        });
        return;
      }
      
      const data = await response.json();
      console.log('API test successful:', data);
      toast({
        title: "API Test Successful",
        description: "Gemini API is working correctly",
      });
      
    } catch (error) {
      console.error('API test failed:', error);
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
    handleConvertSelected, // Export the new function
    testAPI, // Export the new function
  };
};
