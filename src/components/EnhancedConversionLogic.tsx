import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertSybaseToOracle, generateConversionReport } from '@/utils/conversionUtils';
import { useMigrationManager, FileItem } from './MigrationManager';
import { ConversionResult, ConversionReport } from '@/types';

export const useEnhancedConversionLogic = (
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  setConversionResults: React.Dispatch<React.SetStateAction<ConversionResult[]>>,
  selectedAiModel: string,
  customPrompt?: string
) => {
  const { toast } = useToast();
  const migrationManager = useMigrationManager();
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

  // Convert single file with history tracking
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

      // Save to migration history
      const migrationId = await migrationManager.getOrCreateMigrationId();
      if (migrationId) {
        // Check if file already exists for this migration
        const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
        const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
        
        if (existingFile) {
          // Update existing record
          await migrationManager.updateFileStatus(
            existingFile.id,
            mapConversionStatus(result.status),
            result.convertedCode,
            result.issues?.map((i: any) => i.description).join('; ') || undefined,
            result.dataTypeMapping,
            result.performance,
            result.issues
          );
        } else {
          // Insert new record
          await migrationManager.handleCodeUpload([{
            id: file.id,
            name: file.name,
            type: file.type,
            content: file.content
          }]);
          
          // Update the newly created file with conversion results
          const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
          const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (newFile) {
            await migrationManager.updateFileStatus(
              newFile.id,
              mapConversionStatus(result.status),
              result.convertedCode,
              result.issues?.map((i: any) => i.description).join('; ') || undefined,
              result.dataTypeMapping,
              result.performance,
              result.issues
            );
          }
        }
      } else {
        console.warn('No migrationId found for conversion. File will not be added to history.');
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
      
      // Save failed file to database
      const migrationId = await migrationManager.getOrCreateMigrationId();
      if (migrationId) {
        const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
        const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
        
        if (existingFile) {
          // Update existing file
          await migrationManager.updateFileStatus(
            existingFile.id,
            'failed',
            undefined,
            error instanceof Error ? error.message : 'Unknown error'
          );
        } else {
          // Insert new failed file record
          await migrationManager.handleCodeUpload([{
            id: file.id,
            name: file.name,
            type: file.type,
            content: file.content
          }]);
          
          // Update the newly created file with failed status
          const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
          const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (newFile) {
            await migrationManager.updateFileStatus(
              newFile.id,
              'failed',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      }
    } finally {
      setConvertingFileIds(convertingFileIds.filter(id => id !== fileId));
      setIsConverting(false);
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds, migrationManager]);

  // Convert all files by type with history tracking
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

        // Save to migration history
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            await migrationManager.updateFileStatus(
              existingFile.id,
              mapConversionStatus(result.status),
              result.convertedCode,
              result.issues?.map((i: any) => i.description).join('; ') || undefined,
              result.dataTypeMapping,
              result.performance,
              result.issues
            );
          } else {
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                mapConversionStatus(result.status),
                result.convertedCode,
                result.issues?.map((i: any) => i.description).join('; ') || undefined,
                result.dataTypeMapping,
                result.performance,
                result.issues
              );
            }
          }
        }
      } catch (error) {
        console.error(`Conversion failed for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, conversionStatus: 'failed' } : f
        ));
        
        // Save failed file to database
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            // Update existing file
            await migrationManager.updateFileStatus(
              existingFile.id,
              'failed',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
          } else {
            // Insert new failed file record
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            // Update the newly created file with failed status
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                'failed',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        }
      } finally {
        setConvertingFileIds(convertingFileIds.filter(id => id !== file.id));
      }
    }
    
    setConvertingFileIds([]);
    setIsConverting(false);
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, convertingFileIds, setConvertingFileIds, migrationManager]);

  // Convert all files with history tracking - SEQUENTIAL BATCH PROCESSING
  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    const batchSize = 5; // Process 5 files at a time
    const results: any[] = [];
    let convertingIds = new Set<string>();

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
            await delay(2500);
          }
        }
      }
      throw lastError;
    };

    const convertFile = async (file: FileItem) => {
      convertingIds.add(file.id);
      setConvertingFileIds(Array.from(convertingIds));
      
      try {
        console.log(`[BATCH CONVERT] Starting: ${file.name}`);
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

        // Save to migration history
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            await migrationManager.updateFileStatus(
              existingFile.id,
              mapConversionStatus(result.status),
              result.convertedCode,
              result.issues?.map((i: any) => i.description).join('; ') || undefined,
              result.dataTypeMapping,
              result.performance,
              result.issues
            );
          } else {
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                mapConversionStatus(result.status),
                result.convertedCode,
                result.issues?.map((i: any) => i.description).join('; ') || undefined,
                result.dataTypeMapping,
                result.performance,
                result.issues
              );
            }
          }
        }
        
        console.log(`[BATCH CONVERT] Completed: ${file.name}`);
      } catch (error) {
        console.error(`[BATCH CONVERT] Failed: ${file.name}`, error);
        results.push({ fileId: file.id, error, status: 'failed' });
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, conversionStatus: 'failed', errorMessage: error?.message || String(error) } : f
          )
        );
        
        // Save failed file to database
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            // Update existing file
            await migrationManager.updateFileStatus(
              existingFile.id,
              'failed',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
          } else {
            // Insert new failed file record
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            // Update the newly created file with failed status
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                'failed',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        }
      } finally {
        convertingIds.delete(file.id);
        setConvertingFileIds(Array.from(convertingIds));
      }
    };

    // Process files in sequential batches
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const currentBatch = pendingFiles.slice(i, i + batchSize);
      console.log(`[BATCH CONVERT] Starting batch ${Math.floor(i / batchSize) + 1} with ${currentBatch.length} files`);
      
      // Convert all files in the current batch in parallel
      const batchPromises = currentBatch.map(file => convertFile(file));
      
      // Wait for ALL files in this batch to complete before moving to next batch
      await Promise.all(batchPromises);
      
      console.log(`[BATCH CONVERT] Completed batch ${Math.floor(i / batchSize) + 1}`);
      
      // Add a small delay between batches (optional)
      if (i + batchSize < pendingFiles.length) {
        console.log(`[BATCH CONVERT] Waiting 2 seconds before next batch...`);
        await delay(2000);
      }
    }

    setConvertingFileIds([]);
    setIsConverting(false);
    
    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
      toast({
        title: 'Sequential Batch Conversion Complete',
        description: `${pendingFiles.length - failedCount} succeeded, ${failedCount} failed.`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } else {
      toast({
        title: 'Sequential Batch Conversion Complete',
        description: `All ${pendingFiles.length} files converted successfully!`,
      });
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, migrationManager]);

  // Convert selected files with history tracking - SEQUENTIAL BATCH PROCESSING
  const handleConvertSelected = useCallback(async (fileIds: string[]) => {
    console.log('[handleConvertSelected] Called with fileIds:', fileIds);
    const selectedFiles = fileIds
      .map(id => files.find(f => f.id === id && f.conversionStatus === 'pending'))
      .filter(Boolean) as FileItem[];
    if (selectedFiles.length === 0) return;

    setIsConverting(true);
    const batchSize = 5; // Process 5 files at a time
    const results: any[] = [];
    let convertingIds = new Set<string>();

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
            await delay(2500);
          }
        }
      }
      throw lastError;
    };

    const convertFile = async (file: FileItem) => {
      convertingIds.add(file.id);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, conversionStatus: 'converting' } : f));
      setConvertingFileIds(Array.from(convertingIds));
      
      try {
        console.log(`[SELECTED BATCH CONVERT] Starting: ${file.name}`);
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

        // Save to migration history
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            await migrationManager.updateFileStatus(
              existingFile.id,
              mapConversionStatus(result.status),
              result.convertedCode,
              result.issues?.map((i: any) => i.description).join('; ') || undefined,
              result.dataTypeMapping,
              result.performance,
              result.issues
            );
          } else {
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                mapConversionStatus(result.status),
                result.convertedCode,
                result.issues?.map((i: any) => i.description).join('; ') || undefined,
                result.dataTypeMapping,
                result.performance,
                result.issues
              );
            }
          }
        }
        
        console.log(`[SELECTED BATCH CONVERT] Completed: ${file.name}`);
      } catch (error) {
        console.error(`[SELECTED BATCH CONVERT] Failed: ${file.name}`, error);
        results.push({ fileId: file.id, error, status: 'failed' });
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, conversionStatus: 'failed', errorMessage: error?.message || String(error) } : f
          )
        );
        
        // Save failed file to database
        const migrationId = await migrationManager.getOrCreateMigrationId();
        if (migrationId) {
          const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
          const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
          
          if (existingFile) {
            // Update existing file
            await migrationManager.updateFileStatus(
              existingFile.id,
              'failed',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
          } else {
            // Insert new failed file record
            await migrationManager.handleCodeUpload([{
              id: file.id,
              name: file.name,
              type: file.type,
              content: file.content
            }]);
            
            // Update the newly created file with failed status
            const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
            const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
            
            if (newFile) {
              await migrationManager.updateFileStatus(
                newFile.id,
                'failed',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        }
      } finally {
        convertingIds.delete(file.id);
        setConvertingFileIds(Array.from(convertingIds));
      }
    };

    // Process selected files in sequential batches
    for (let i = 0; i < selectedFiles.length; i += batchSize) {
      const currentBatch = selectedFiles.slice(i, i + batchSize);
      console.log(`[SELECTED BATCH CONVERT] Starting batch ${Math.floor(i / batchSize) + 1} with ${currentBatch.length} files`);
      
      // Convert all files in the current batch in parallel
      const batchPromises = currentBatch.map(file => convertFile(file));
      
      // Wait for ALL files in this batch to complete before moving to next batch
      await Promise.all(batchPromises);
      
      console.log(`[SELECTED BATCH CONVERT] Completed batch ${Math.floor(i / batchSize) + 1}`);
      
      // Add a small delay between batches (optional)
      if (i + batchSize < selectedFiles.length) {
        console.log(`[SELECTED BATCH CONVERT] Waiting 2 seconds before next batch...`);
        await delay(2000);
      }
    }

    setConvertingFileIds([]);
    setIsConverting(false);
    
    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
      toast({
        title: 'Selected Files Sequential Batch Conversion Complete',
        description: `${selectedFiles.length - failedCount} succeeded, ${failedCount} failed.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Selected Files Sequential Batch Conversion Complete',
        description: `All ${selectedFiles.length} selected files converted successfully!`,
      });
    }
  }, [files, selectedAiModel, customPrompt, setFiles, setConversionResults, toast, migrationManager]);

  // Generate and save conversion report
  const handleGenerateReport = useCallback(async () => {
    try {
      // Get successful files from the current files state
      const successfulFiles = files.filter(f => f.conversionStatus === 'success' && f.convertedContent);
      
      if (successfulFiles.length === 0) {
        toast({
          title: 'No Converted Files',
          description: 'Please convert some files before generating a report',
          variant: 'destructive',
        });
        return null;
      }
      
      // Create conversion results from successful files
      const fileConversionResults: ConversionResult[] = successfulFiles.map(file => ({
        id: crypto.randomUUID(),
        originalFile: {
          id: file.id,
          name: file.name,
          content: file.content,
          type: file.type,
          status: 'success'
        },
        convertedCode: file.convertedContent || '',
        issues: file.issues || [],
        dataTypeMapping: file.dataTypeMapping || [],
        performance: file.performanceMetrics,
        status: 'success'
      }));
      
      const report = await generateConversionReport(fileConversionResults);
      
      // Save report to migration history
      const migrationId = await migrationManager.getOrCreateMigrationId();
      if (migrationId) {
        console.log('Report generated and ready to save to migration:', report);
      }
      
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate conversion report',
        variant: 'destructive',
      });
      return null;
    }
  }, [files, migrationManager, toast]);

  return {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleConvertSelected,
    handleGenerateReport,
  };
};

export default useEnhancedConversionLogic; 