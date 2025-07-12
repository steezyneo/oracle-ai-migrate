
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Folder, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileStructure } from '@/types';

interface FolderUploaderProps {
  onFolderUpload: (files: FileStructure[], projectName: string) => void;
}

const FolderUploader: React.FC<FolderUploaderProps> = ({ onFolderUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractDatabaseName = (filePath: string): string => {
    // Extract database name from path like "Database1/Tables/table1.sql"
    const pathParts = filePath.split('/');
    if (pathParts.length >= 2) {
      return pathParts[0]; // First folder is the database name
    }
    return 'default';
  };

  const determineFileType = (fileName: string, path: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    const lowerPath = path.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    // Check path first (more reliable)
    if (lowerPath.includes('/tables/') || lowerPath.includes('\\tables\\')) {
      return 'table';
    }
    if (lowerPath.includes('/procedures/') || lowerPath.includes('\\procedures\\')) {
      return 'procedure';
    }
    if (lowerPath.includes('/triggers/') || lowerPath.includes('\\triggers\\')) {
      return 'trigger';
    }
    
    // Check file extension and name
    if (lowerName.endsWith('.tab') || lowerName.includes('table')) {
      return 'table';
    }
    if (lowerName.endsWith('.prc') || lowerName.includes('proc')) {
      return 'procedure';
    }
    if (lowerName.endsWith('.trg') || lowerName.includes('trigger')) {
      return 'trigger';
    }
    
    return 'other';
  };

  const processFileStructure = (files: FileList): { fileStructure: FileStructure[], databases: Set<string> } => {
    const fileStructure: FileStructure[] = [];
    const databases = new Set<string>();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;
      const databaseName = extractDatabaseName(path);
      databases.add(databaseName);
      
      const fileObj: FileStructure = {
        name: file.name,
        path: path,
        type: 'file',
        databaseName: databaseName,
        content: '' // Will be filled later
      };
      
      fileStructure.push(fileObj);
    }
    
    return { fileStructure, databases };
  };

  const handleFileSelect = async (files: FileList | null, uploadType: 'files' | 'folder' = 'files') => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    try {
      let projectName = '';
      
      if (uploadType === 'folder') {
        projectName = extractProjectName(files);
      } else {
        projectName = `Files_${new Date().toISOString().split('T')[0]}`;
      }
      
      // Process file structure first
      const { fileStructure, databases } = processFileStructure(files);
      
      // Read file contents
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        fileStructure[i].content = content;
      }
      
      onFolderUpload(fileStructure, projectName);
      
      const dbCount = databases.size;
      const fileCount = files.length;
      
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''} from ${dbCount} database${dbCount > 1 ? 's' : ''}`,
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
      const pathParts = files[0].webkitRelativePath.split('/');
      return pathParts[0]; // Use the root folder name as project name
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
          Select files or folder containing your Sybase code files organized by database structure
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
                Upload .sql, .proc, .trig files organized by database folders
              </p>
              <p className="text-sm text-gray-500">
                Expected structure: DatabaseName/Tables/, DatabaseName/Procedures/, DatabaseName/Triggers/
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
