import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useMigrationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);

  const startNewMigration = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('migrations')
        .insert({ 
          user_id: user.id,
          project_name: `Migration_${new Date().toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '')}`
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
  }, [user, toast]);

  const handleCodeUpload = useCallback(async (uploadedFiles: any[]): Promise<FileItem[]> => {
    // Ensure a migration exists before uploading files
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
    // No longer insert files into migration_files or migrations here. This is now done after deployment to Oracle.
    return convertedFiles;
  }, [user, toast, currentMigrationId, startNewMigration]);

  return {
    currentMigrationId,
    handleCodeUpload,
    startNewMigration,
  };
};
