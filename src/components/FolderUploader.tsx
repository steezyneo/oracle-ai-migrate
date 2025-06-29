
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FolderUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

const FolderUploader: React.FC<FolderUploaderProps> = ({ onFilesSelected }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select a folder containing SQL files.',
        variant: 'destructive',
      });
      return;
    }

    // Filter for SQL files
    const sqlFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.sql') || 
      file.name.toLowerCase().endsWith('.txt') ||
      file.type === 'text/plain'
    );

    if (sqlFiles.length === 0) {
      toast({
        title: 'No SQL Files Found',
        description: 'The selected folder does not contain any SQL files.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Selected SQL files:', sqlFiles);
    onFilesSelected(sqlFiles);
    
    toast({
      title: 'Folder Uploaded',
      description: `Successfully loaded ${sqlFiles.length} SQL files from the folder.`,
    });

    // Reset the input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const triggerFolderSelect = () => {
    folderInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={folderInputRef}
        type="file"
        onChange={handleFolderSelect}
        style={{ display: 'none' }}
        webkitdirectory=""
        directory=""
        multiple
        accept=".sql,.txt"
      />
      <Button
        onClick={triggerFolderSelect}
        variant="outline"
        className="w-full"
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        Browse Folder
      </Button>
    </>
  );
};

export default FolderUploader;
