
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeFile } from '@/types';
import FolderUploader from './FolderUploader';

interface CodeUploaderProps {
  onFilesUploaded: (files: CodeFile[]) => void;
  projectName: string;
  setProjectName: (name: string) => void;
}

const CodeUploader: React.FC<CodeUploaderProps> = ({
  onFilesUploaded,
  projectName,
  setProjectName,
}) => {
  const { toast } = useToast();
  const [manualFile, setManualFile] = useState({
    filename: '',
    type: 'table' as 'table' | 'procedure' | 'trigger',
    content: '',
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const codeFiles: CodeFile[] = [];
      
      for (const file of acceptedFiles) {
        const content = await readFileContent(file);
        const fileType = detectFileType(file.name, content);
        
        const codeFile: CodeFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          content,
          type: fileType,
          status: 'pending',
        };
        
        codeFiles.push(codeFile);
      }
      
      onFilesUploaded(codeFiles);
      toast({
        title: 'Files Uploaded',
        description: `Successfully uploaded ${codeFiles.length} files.`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    }
  }, [onFilesUploaded, toast]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const detectFileType = (filename: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerFilename.includes('table') || lowerContent.includes('create table')) {
      return 'table';
    } else if (lowerFilename.includes('proc') || lowerContent.includes('create proc')) {
      return 'procedure';
    } else if (lowerFilename.includes('trigger') || lowerContent.includes('create trigger')) {
      return 'trigger';
    }
    
    return 'other';
  };

  const handleManualAdd = () => {
    if (!manualFile.filename || !manualFile.content) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in both filename and content.',
        variant: 'destructive',
      });
      return;
    }

    const codeFile: CodeFile = {
      id: `manual-${Date.now()}-${Math.random()}`,
      name: manualFile.filename.endsWith('.sql') ? manualFile.filename : `${manualFile.filename}.sql`,
      content: manualFile.content,
      type: manualFile.type,
      status: 'pending',
    };

    onFilesUploaded([codeFile]);
    
    // Reset form
    setManualFile({
      filename: '',
      type: 'table',
      content: '',
    });

    toast({
      title: 'File Added',
      description: `Successfully added ${codeFile.name}.`,
    });
  };

  const handleFolderFiles = (files: File[]) => {
    onDrop(files);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sql', '.txt'],
      'application/sql': ['.sql'],
    },
    multiple: true,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Code Files</CardTitle>
          <CardDescription>
            Upload your Sybase SQL files for conversion to Oracle PL/SQL.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="mt-2"
            />
          </div>

          <Tabs defaultValue="drag-drop" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="drag-drop">Drag & Drop</TabsTrigger>
              <TabsTrigger value="folder">Browse Folder</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>
            
            <TabsContent value="drag-drop" className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop SQL files'}
                </h3>
                <p className="text-gray-500 mb-4">
                  Or click to browse and select files
                </p>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Supported formats: .sql, .txt
              </p>
            </TabsContent>

            <TabsContent value="folder" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Browse Folder</h3>
                <p className="text-gray-500 mb-4">
                  Select a folder containing your SQL files
                </p>
                <FolderUploader onFilesSelected={handleFolderFiles} />
              </div>
              <p className="text-sm text-gray-500 text-center">
                This will upload all SQL files from the selected folder
              </p>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={manualFile.filename}
                    onChange={(e) => setManualFile(prev => ({ ...prev, filename: e.target.value }))}
                    placeholder="e.g., customers_table.sql"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="file-type">Template Type</Label>
                  <Select
                    value={manualFile.type}
                    onValueChange={(value: 'table' | 'procedure' | 'trigger') => 
                      setManualFile(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="trigger">Trigger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Code Content</Label>
                  <Textarea
                    id="content"
                    value={manualFile.content}
                    onChange={(e) => setManualFile(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Paste your Sybase code here..."
                    className="mt-2 min-h-[200px] font-mono"
                  />
                </div>

                <Button onClick={handleManualAdd} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add File
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeUploader;
