
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileDownloaderProps {
  fileName: string;
  content: string;
  fileType: 'table' | 'procedure' | 'trigger' | 'other';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const FileDownloader: React.FC<FileDownloaderProps> = ({
  fileName,
  content,
  fileType,
  variant = 'outline',
  size = 'sm'
}) => {
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      // Create a blob with the file content
      const blob = new Blob([content], { type: 'text/plain' });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.sql') ? fileName : `${fileName}.sql`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: `${fileName} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Download
    </Button>
  );
};

export default FileDownloader;
