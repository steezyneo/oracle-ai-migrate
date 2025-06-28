import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Plus, Database, FileText, RefreshCw, Download, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserDropdown from '@/components/UserDropdown';
import FolderUploader from '@/components/FolderUploader';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import MigrationReport from '@/components/MigrationReport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
}

interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description: string;
}

interface ConversionIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  lineNumber?: number;
  suggestedFix?: string;
  originalCode?: string;
}

interface PerformanceMetrics {
  originalComplexity: number;
  convertedComplexity: number;
  improvementPercentage: number;
  recommendations: string[];
}

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
  [key: string]: any; // Add index signature to make it compatible with Json type
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'report'>('upload');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);
  const [migrationReport, setMigrationReport] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const determineFileType = (fileName: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    const lowerName = fileName.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerName.includes('table') || lowerContent.includes('create table')) {
      return 'table';
    }
    if (lowerName.includes('proc') || lowerName.includes('procedure') || lowerContent.includes('create procedure')) {
      return 'procedure';
    }
    if (lowerName.includes('trig') || lowerName.includes('trigger') || lowerContent.includes('create trigger')) {
      return 'trigger';
    }
    return 'other';
  };

  const generateDataTypeMapping = (content: string): DataTypeMapping[] => {
    const mappings: DataTypeMapping[] = [];
    
    // Common Sybase to Oracle mappings
    if (content.toLowerCase().includes('int')) {
      mappings.push({
        sybaseType: 'INT',
        oracleType: 'NUMBER(10)',
        description: 'Integer values converted to NUMBER with precision 10'
      });
    }
    
    if (content.toLowerCase().includes('varchar')) {
      mappings.push({
        sybaseType: 'VARCHAR',
        oracleType: 'VARCHAR2',
        description: 'Variable character strings'
      });
    }
    
    if (content.toLowerCase().includes('datetime')) {
      mappings.push({
        sybaseType: 'DATETIME',
        oracleType: 'TIMESTAMP',
        description: 'Date and time values with higher precision'
      });
    }
    
    return mappings;
  };

  const generateConversionIssues = (content: string): ConversionIssue[] => {
    const issues: ConversionIssue[] = [];
    
    if (content.includes('@')) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'error',
        description: 'Sybase variable notation (@) needs conversion',
        suggestedFix: 'Replace @ variables with Oracle PL/SQL variable syntax',
        originalCode: '@variable_name'
      });
    }
    
    if (content.toLowerCase().includes('getdate()')) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        description: 'Sybase GETDATE() function needs replacement',
        suggestedFix: 'Use SYSDATE in Oracle',
        originalCode: 'GETDATE()'
      });
    }
    
    return issues;
  };

  const generatePerformanceMetrics = (): PerformanceMetrics => {
    return {
      originalComplexity: Math.floor(Math.random() * 100) + 50,
      convertedComplexity: Math.floor(Math.random() * 50) + 20,
      improvementPercentage: Math.floor(Math.random() * 40) + 15,
      recommendations: [
        'Consider using bind variables for better performance',
        'Index optimization recommended for large tables',
        'Review query execution plans'
      ]
    };
  };

  const handleFolderUpload = async (uploadedFiles: FileStructure[], projectName: string) => {
    try {
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user.id,
          project_name: projectName,
          folder_structure: uploadedFiles
        })
        .select()
        .single();

      if (migrationError) {
        throw migrationError;
      }

      setCurrentMigrationId(migration.id);

      const processedFiles: FileItem[] = [];
      
      for (const file of uploadedFiles) {
        if (file.type === 'file' && file.content) {
          const fileType = determineFileType(file.name, file.content);
          
          const { data: fileRecord, error: fileError } = await supabase
            .from('migration_files')
            .insert({
              migration_id: migration.id,
              file_name: file.name,
              file_path: file.path,
              file_type: fileType,
              original_content: file.content,
              conversion_status: 'pending'
            })
            .select()
            .single();

          if (fileError) {
            console.error('Error creating file record:', fileError);
            continue;
          }

          processedFiles.push({
            id: fileRecord.id,
            name: file.name,
            path: file.path,
            type: fileType,
            content: file.content,
            conversionStatus: 'pending'
          });
        }
      }

      setFiles(processedFiles);
      setCurrentStep('review');
      
      toast({
        title: "Project Created",
        description: `Successfully created project "${projectName}" with ${processedFiles.length} files`,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleConvertFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const convertedContent = `-- Converted Oracle code for ${file.name}\n${file.content.replace(/sybase/gi, 'oracle')}`;
      const isSuccess = Math.random() > 0.2;
      
      const dataTypeMapping = generateDataTypeMapping(file.content);
      const issues = generateConversionIssues(file.content);
      const performanceMetrics = generatePerformanceMetrics();
      
      const { error } = await supabase
        .from('migration_files')
        .update({
          converted_content: isSuccess ? convertedContent : null,
          conversion_status: isSuccess ? 'success' : 'failed',
          error_message: isSuccess ? null : 'Conversion failed: Unsupported syntax detected'
        })
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              conversionStatus: isSuccess ? 'success' : 'failed',
              convertedContent: isSuccess ? convertedContent : undefined,
              errorMessage: isSuccess ? undefined : 'Conversion failed: Unsupported syntax detected',
              dataTypeMapping: isSuccess ? dataTypeMapping : undefined,
              issues: isSuccess ? issues : undefined,
              performanceMetrics: isSuccess ? performanceMetrics : undefined
            }
          : f
      ));

      toast({
        title: isSuccess ? "Conversion Successful" : "Conversion Failed",
        description: isSuccess 
          ? `Successfully converted ${file.name}` 
          : `Failed to convert ${file.name}`,
        variant: isSuccess ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error converting file:', error);
      toast({
        title: "Error",
        description: "Failed to convert file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFixWithAI = async (issueId: string) => {
    if (!selectedFile) return;
    
    toast({
      title: "AI Fix in Progress",
      description: "Applying AI fix to the issue...",
    });

    // Simulate AI fix
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedFile = {
      ...selectedFile,
      convertedContent: selectedFile.convertedContent?.replace(/@/g, 'v_'),
      issues: selectedFile.issues?.filter(issue => issue.id !== issueId)
    };
    
    setSelectedFile(updatedFile);
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
    
    toast({
      title: "AI Fix Applied",
      description: "The issue has been resolved automatically.",
    });
  };

  const handleManualEdit = (newContent: string) => {
    if (!selectedFile) return;
    
    const updatedFile = {
      ...selectedFile,
      convertedContent: newContent
    };
    
    setSelectedFile(updatedFile);
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
  };

  const handleCompleteMigration = async () => {
    const report = {
      id: crypto.randomUUID(),
      migrationId: currentMigrationId,
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      successfulFiles: files.filter(f => f.conversionStatus === 'success').length,
      failedFiles: files.filter(f => f.conversionStatus === 'failed').length,
      files: files
    };
    
    setMigrationReport(report);
    setCurrentStep('report');
    
    toast({
      title: "Migration Completed",
      description: "Migration report has been generated successfully.",
    });
  };

  const handleStartNewMigration = () => {
    setCurrentStep('upload');
    setFiles([]);
    setSelectedFile(null);
    setCurrentMigrationId(null);
    setMigrationReport(null);
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleConvertAllByType = async (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    const filesToConvert = files.filter(f => f.type === type && f.conversionStatus === 'pending');
    
    if (filesToConvert.length === 0) {
      toast({
        title: "No files to convert",
        description: `All ${type} files have already been processed.`,
      });
      return;
    }

    toast({
      title: "Converting files",
      description: `Converting ${filesToConvert.length} ${type} files...`,
    });

    // Convert files one by one with a small delay
    for (const file of filesToConvert) {
      await handleConvertFile(file.id);
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast({
      title: "Conversion completed",
      description: `Successfully processed ${filesToConvert.length} ${type} files.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Migration Dashboard</h1>
              </div>
              
              <Button 
                onClick={handleStartNewMigration}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Start New Migration
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleViewHistory}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentStep === 'upload' ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <FolderUploader onFolderUpload={handleFolderUpload} />
          </div>
        ) : currentStep === 'review' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <FileTreeView
                files={files}
                onFileSelect={handleFileSelect}
                onConvertFile={handleConvertFile}
                onConvertAllByType={handleConvertAllByType}
                selectedFile={selectedFile}
              />
            </div>
            
            <div className="lg:col-span-2">
              {selectedFile ? (
                <div className="space-y-6">
                  <ConversionViewer
                    file={selectedFile}
                    onFixWithAI={handleFixWithAI}
                    onManualEdit={handleManualEdit}
                  />
                  
                  {selectedFile.conversionStatus === 'success' && (
                    <ConversionActions
                      hasConvertedFiles={files.some(f => f.conversionStatus === 'success')}
                      onCompleteMigration={handleCompleteMigration}
                    />
                  )}
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a file to view
                    </h3>
                    <p className="text-gray-600">
                      Choose a file from the project structure to view its content and conversion status
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <MigrationReport 
            report={migrationReport}
            onBack={() => setCurrentStep('review')}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
