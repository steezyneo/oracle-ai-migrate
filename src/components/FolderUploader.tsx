
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Folder, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
  [key: string]: any;
}

interface FolderUploaderProps {
  onFolderUpload: (files: FileStructure[], projectName: string) => void;
}

const FolderUploader: React.FC<FolderUploaderProps> = ({ onFolderUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null, uploadType: 'files' | 'folder' = 'files') => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    try {
      const fileStructure: FileStructure[] = [];
      let projectName = '';
      
      if (uploadType === 'folder') {
        projectName = extractProjectName(files);
      } else {
        projectName = `Files_${new Date().toISOString().split('T')[0]}`;
      }
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        
        const fileObj: FileStructure = {
          name: file.name,
          path: file.webkitRelativePath || file.name,
          type: 'file',
          content: content
        };
        
        fileStructure.push(fileObj);
      }
      
      onFolderUpload(fileStructure, projectName);
      
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the uploaded files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractProjectName = (files: FileList): string => {
    if (files.length > 0 && files[0].webkitRelativePath) {
      return files[0].webkitRelativePath.split('/')[0];
    }
    return `Project_${new Date().toISOString().split('T')[0]}`;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      handleFileSelect(fileList.files, 'files');
    }
  };

  const handleFilesUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFolderUpload = () => {
    folderInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Code Files
        </CardTitle>
        <CardDescription>
          Select files or folder containing your Sybase code files to begin migration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Folder className="h-8 w-8 text-gray-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isProcessing ? 'Processing Files...' : 'Drop files here or choose upload option'}
              </h3>
              <p className="text-gray-600 mb-4">
                Upload .sql, .proc, .trig files and more
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleFilesUpload}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Upload Files'}
              </Button>
              
              <Button
                onClick={handleFolderUpload}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Folder className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Choose Folder'}
              </Button>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files, 'files')}
          className="hidden"
          accept=".sql,.txt,.tab,.prc,.trg"
        />
        
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          multiple
          onChange={(e) => handleFileSelect(e.target.files, 'folder')}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default FolderUploader;
