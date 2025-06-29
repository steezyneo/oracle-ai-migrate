import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Upload, History, RefreshCw, Download, Home, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { convertSybaseToOracle, generateConversionReport } from '@/utils/conversionUtils';
import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from "@google/generative-ai";

import CodeUploader from '@/components/CodeUploader';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import ReportViewer from '@/components/ReportViewer';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import Help from '@/components/Help';

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
  [key: string]: any;
}

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

interface ConversionResult {
  id: string;
  originalFile: FileItem;
  convertedCode: string;
  issues: any[];
  performance: any;
  status: 'success' | 'warning' | 'error';
  dataTypeMapping: any[];
}

interface ConversionReport {
  timestamp: string;
  filesProcessed: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  results: ConversionResult[];
  summary: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAiU5Dt6ZEEYsYCh4Z02GNm1XWXup6xcBg";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const initialTab = location.state?.activeTab || 'upload';
  
  const [activeTab, setActiveTab] = useState<'upload' | 'conversion'>(initialTab);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user && !currentMigrationId) {
      startNewMigration();
    }
  }, [user, loading, navigate, currentMigrationId]);

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const firstConvertedFile = files.find(f => f.convertedContent);
      setSelectedFile(firstConvertedFile || files[0]);
    }
  }, [files, selectedFile]);

  const startNewMigration = async () => {
    try {
      const { data, error } = await supabase
        .from('migrations')
        .insert({ 
          user_id: user?.id,
          project_name: `Migration_${new Date().toISOString().split('T')[0]}`
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting new migration:', error);
        toast({
          title: "Migration Error",
          description: "Failed to start new migration",
          variant: "destructive",
        });
      } else {
        setCurrentMigrationId(data.id);
      }
    } catch (error) {
      console.error('Error starting new migration:', error);
    }
  };

  const handleCodeUpload = async (uploadedFiles: any[]) => {
    const convertedFiles: FileItem[] = uploadedFiles.map(file => ({
      id: file.id,
      name: file.name,
      path: file.name,
      type: file.type,
      content: file.content,
      conversionStatus: 'pending' as const,
      dataTypeMapping: [],
      issues: [],
      performanceMetrics: undefined,
      convertedContent: undefined,
      errorMessage: undefined,
    }));

    setFiles(convertedFiles);
    setActiveTab('conversion');

    try {
      if (!currentMigrationId) {
        console.error('No migration ID available');
        toast({
          title: "Upload Failed",
          description: "No migration ID available",
          variant: "destructive",
        });
        return;
      }

      for (const file of convertedFiles) {
        await supabase.from('migration_files').insert({
          migration_id: currentMigrationId,
          file_name: file.name,
          file_path: file.path,
          file_type: file.type,
          original_content: file.content,
          conversion_status: 'pending',
        });
      }

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${convertedFiles.length} file${convertedFiles.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error saving files to Supabase:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to save the uploaded files",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

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

  const handleConvertFile = async (fileId: string) => {
    setIsConverting(true);
    try {
      const fileToConvert = files.find(file => file.id === fileId);
      if (!fileToConvert) {
        console.error('File not found');
        return;
      }

      const conversionResult = await convertSybaseToOracle(fileToConvert);
      const mappedStatus = mapConversionStatus(conversionResult.status);

      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === fileId
            ? {
                ...file,
                conversionStatus: mappedStatus,
                convertedContent: conversionResult.convertedCode,
                issues: conversionResult.issues,
                dataTypeMapping: conversionResult.dataTypeMapping,
                performanceMetrics: conversionResult.performance
              }
            : file
        )
      );

      if (selectedFile?.id === fileId) {
        setSelectedFile(prev => prev ? {
          ...prev,
          conversionStatus: mappedStatus,
          convertedContent: conversionResult.convertedCode,
          issues: conversionResult.issues,
          performanceMetrics: conversionResult.performance
        } : null);
      }

      await supabase
        .from('migration_files')
        .update({
          conversion_status: mappedStatus,
          converted_content: conversionResult.convertedCode,
          error_message: conversionResult.issues.length > 0 ? conversionResult.issues[0].description : null,
        })
        .eq('file_name', fileToConvert.name);

      toast({
        title: "File Converted",
        description: `Successfully converted ${fileToConvert.name}`,
      });
    } catch (error: any) {
      console.error('Error converting file:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert the file",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertAllByType = async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    setIsConverting(true);
    try {
      const filesToConvert = files.filter(file => file.type === type && file.conversionStatus === 'pending');
      if (filesToConvert.length === 0) {
        toast({
          title: "No Files to Convert",
          description: `No ${type} files with pending status found.`,
        });
        return;
      }

      for (const file of filesToConvert) {
        const conversionResult = await convertSybaseToOracle(file);
        const mappedStatus = mapConversionStatus(conversionResult.status);

        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  conversionStatus: mappedStatus,
                  convertedContent: conversionResult.convertedCode,
                  issues: conversionResult.issues,
                  dataTypeMapping: conversionResult.dataTypeMapping,
                  performanceMetrics: conversionResult.performance
                }
              : f
          )
        );

        await supabase
          .from('migration_files')
          .update({
            conversion_status: mappedStatus,
            converted_content: conversionResult.convertedCode,
            error_message: conversionResult.issues.length > 0 ? conversionResult.issues[0].description : null,
          })
          .eq('file_name', file.name);
      }

      toast({
        title: "Files Converted",
        description: `Successfully converted all ${type} files`,
      });
    } catch (error: any) {
      console.error('Error converting files:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert the files",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertAll = async () => {
    setIsConverting(true);
    try {
      const filesToConvert = files.filter(file => file.conversionStatus === 'pending');
      if (filesToConvert.length === 0) {
        toast({
          title: "No Files to Convert",
          description: "No files with pending status found.",
        });
        return;
      }

      for (const file of filesToConvert) {
        const conversionResult = await convertSybaseToOracle(file);
        const mappedStatus = mapConversionStatus(conversionResult.status);

        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  conversionStatus: mappedStatus,
                  convertedContent: conversionResult.convertedCode,
                  issues: conversionResult.issues,
                  dataTypeMapping: conversionResult.dataTypeMapping,
                  performanceMetrics: conversionResult.performance
                }
              : f
          )
        );

        await supabase
          .from('migration_files')
          .update({
            conversion_status: mappedStatus,
            converted_content: conversionResult.convertedCode,
            error_message: conversionResult.issues.length > 0 ? conversionResult.issues[0].description : null,
          })
          .eq('file_name', file.name);
      }

      toast({
        title: "Files Converted",
        description: "Successfully converted all files",
      });
    } catch (error: any) {
      console.error('Error converting files:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert the files",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleFixFile = async (fileId: string) => {
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
  };

  const handleFixWithAI = async (issueId: string) => {
    if (!selectedFile) return;
    const fileIdx = files.findIndex(f => f.id === selectedFile.id);
    if (fileIdx === -1) return;
    const issue = selectedFile.issues?.find(i => i.id === issueId);
    if (!issue || !selectedFile.convertedContent) return;

    try {
      // Prepare prompt for Gemini
      const prompt = `You are an expert in Sybase to Oracle code migration.\n\nHere is the original Sybase code:\n${selectedFile.content}\n\nHere is the current Oracle code (with issues):\n${selectedFile.convertedContent}\n\nHere is the issue to fix: ${issue.description}${issue.originalCode ? `\nOriginal code: ${issue.originalCode}` : ''}${issue.suggestedFix ? `\nSuggested fix: ${issue.suggestedFix}`