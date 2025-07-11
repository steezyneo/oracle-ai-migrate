import React, { useState, useEffect, useCallback } from 'react';
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
    if (!currentMigrationId) {
      await startNewMigration();
    }
    const migrationId = currentMigrationId || (await (async () => {
      const { data } = await supabase
        .from('migrations')
        .select('id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data?.id;
    })());
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
    try {
      if (!migrationId) {
        console.error('No migration ID available');
        toast({
          title: "Upload Failed",
          description: "No migration ID available",
          variant: "destructive",
        });
        return convertedFiles;
      }
      for (const file of convertedFiles) {
        await supabase.from('migration_files').insert({
          migration_id: migrationId,
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
    return convertedFiles;
  }, [currentMigrationId, toast, startNewMigration, user]);

  return {
    currentMigrationId,
    handleCodeUpload,
    startNewMigration,
  };
};
