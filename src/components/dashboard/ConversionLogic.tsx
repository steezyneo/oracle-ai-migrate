import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertSybaseToOracle, convertMultipleFiles, generateConversionReport } from '@/utils/conversionUtils';
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
  selectedAiModel: string
) => {
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [convertingFileId, setConvertingFileId] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState({ completed: 0, total: 0 });

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

    setConvertingFileId(fileId);
    setIsConverting(true);
    
    try {
      const codeFile = {
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        status: 'pending' as const
      };

      const result = await convertSybaseToOracle(codeFile, selectedAiModel);
      
      const conversionResult: ConversionResult = {
        id: result.id,
        originalFile: {
          ...codeFile,
          status: 'success'
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
      }).eq('id', file.id);

      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${file.name}`,
      });
    } catch (error) {
      console.error('Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
      ));
      toast({
        title: "Conversion Failed",
        description: `Failed to convert ${file.name}`,
        variant: "destructive",
      });
    } finally {
      setConvertingFileId(null);
      setIsConverting(false);
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, toast]);

  const handleConvertAllByType = useCallback(async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    const typeFiles = files.filter(f => f.type === type && f.conversionStatus === 'pending');
    if (typeFiles.length === 0) return;

    setIsConverting(true);
    setConversionProgress({ completed: 0, total: typeFiles.length });
    
    try {
      const codeFiles = typeFiles.map(file => ({
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        status: 'pending' as const
      }));

      const results = await convertMultipleFiles(
        codeFiles, 
        selectedAiModel,
        (completed, total) => {
          setConversionProgress({ completed, total });
        }
      );

      // Update files and results
      results.forEach((result, index) => {
        const file = typeFiles[index];
        const conversionResult: ConversionResult = {
          id: result.id,
          originalFile: {
            ...codeFiles[index],
            status: 'success'
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

        // Update database
        supabase.from('migration_files').update({
          conversion_status: mapConversionStatus(result.status),
          converted_content: result.convertedCode
        }).eq('id', file.id);
      });

      toast({
        title: "Batch Conversion Complete",
        description: `Converted ${results.length} ${type} files`,
      });
    } catch (error) {
      console.error(`Batch conversion failed for ${type}:`, error);
      toast({
        title: "Batch Conversion Failed",
        description: `Failed to convert ${type} files`,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
      setConversionProgress({ completed: 0, total: 0 });
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, toast]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.conversionStatus === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    setConversionProgress({ completed: 0, total: pendingFiles.length });
    
    try {
      const codeFiles = pendingFiles.map(file => ({
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        status: 'pending' as const
      }));

      const results = await convertMultipleFiles(
        codeFiles, 
        selectedAiModel,
        (completed, total) => {
          setConversionProgress({ completed, total });
        }
      );

      // Update files and results
      results.forEach((result, index) => {
        const file = pendingFiles[index];
        const conversionResult: ConversionResult = {
          id: result.id,
          originalFile: {
            ...codeFiles[index],
            status: 'success'
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

        // Update database
        supabase.from('migration_files').update({
          conversion_status: mapConversionStatus(result.status),
          converted_content: result.convertedCode
        }).eq('id', file.id);
      });

      toast({
        title: "All Files Converted",
        description: `Successfully processed ${results.length} files`,
      });
    } catch (error) {
      console.error('Batch conversion failed:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert all files",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
      setConversionProgress({ completed: 0, total: 0 });
    }
  }, [files, selectedAiModel, setFiles, setConversionResults, toast]);

  const handleFixFile = useCallback(async (fileId: string) => {
    setIsConverting(true);
    try {
      const fileToFix = files.find(file => file.id === fileId);
      if (!fileToFix) {
        console.error('File not found');
        return;
      }

      const fixedContent = fileToFix.convertedContent || fileToFix.content;

      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === fileId
            ? { ...file, convertedContent: fixedContent, conversionStatus: 'success' }
            : file
        )
      );

      await supabase
        .from('migration_files')
        .update({
          converted_content: fixedContent,
          conversion_status: 'success',
          error_message: null,
        })
        .eq('file_name', fileToFix.name);

      toast({
        title: "File Fixed",
        description: `Successfully fixed ${fileToFix.name}`,
      });
    } catch (error: any) {
      console.error('Error fixing file:', error);
      toast({
        title: "Fix Failed",
        description: error.message || "Failed to fix the file",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  }, [files, setFiles, toast]);

  const handleGenerateReport = useCallback(async (): Promise<ConversionReport> => {
    const conversionResults: ConversionResult[] = files.map(file => ({
      id: file.id,
      originalFile: {
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        status: 'success'
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
    convertingFileId,
    conversionProgress,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
  };
};
