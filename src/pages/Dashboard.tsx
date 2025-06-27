
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Plus, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserDropdown from '@/components/UserDropdown';
import FolderUploader from '@/components/FolderUploader';
import FileTreeView from '@/components/FileTreeView';
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
}

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);

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

  const handleFolderUpload = async (uploadedFiles: FileStructure[], projectName: string) => {
    try {
      // Create migration record
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

      // Process files and create file records
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
      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock conversion result
      const convertedContent = `-- Converted Oracle code for ${file.name}\n${file.content.replace(/sybase/gi, 'oracle')}`;
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      
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

      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              conversionStatus: isSuccess ? 'success' : 'failed',
              convertedContent: isSuccess ? convertedContent : undefined,
              errorMessage: isSuccess ? undefined : 'Conversion failed: Unsupported syntax detected'
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

  const handleStartNewMigration = () => {
    setCurrentStep('upload');
    setFiles([]);
    setSelectedFile(null);
    setCurrentMigrationId(null);
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === 'upload' ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <FolderUploader onFolderUpload={handleFolderUpload} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Tree */}
            <div className="lg:col-span-1">
              <FileTreeView
                files={files}
                onFileSelect={handleFileSelect}
                onConvertFile={handleConvertFile}
                selectedFile={selectedFile}
              />
            </div>
            
            {/* File Content Viewer */}
            <div className="lg:col-span-2">
              {selectedFile ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedFile.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedFile.conversionStatus === 'success' 
                            ? 'bg-green-100 text-green-800'
                            : selectedFile.conversionStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedFile.conversionStatus}
                        </span>
                        {selectedFile.conversionStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertFile(selectedFile.id)}
                          >
                            Convert
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Original Content */}
                      <div>
                        <h3 className="font-semibold mb-2">Original Sybase Code:</h3>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64">
                          {selectedFile.content}
                        </pre>
                      </div>
                      
                      {/* Converted Content */}
                      {selectedFile.convertedContent && (
                        <div>
                          <h3 className="font-semibold mb-2 text-green-700">Converted Oracle Code:</h3>
                          <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64">
                            {selectedFile.convertedContent}
                          </pre>
                        </div>
                      )}
                      
                      {/* Error Message */}
                      {selectedFile.errorMessage && (
                        <div>
                          <h3 className="font-semibold mb-2 text-red-700">Error:</h3>
                          <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                            {selectedFile.errorMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
        )}
      </main>
    </div>
  );
};

export default Dashboard;
