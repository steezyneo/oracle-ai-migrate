import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed' | 'deployed';
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
  const [isCreatingMigration, setIsCreatingMigration] = useState(false);

  // Start a new migration project
  const startNewMigration = useCallback(async (projectName?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a migration",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsCreatingMigration(true);
      
      const defaultProjectName = projectName || `Migration_${new Date().toLocaleTimeString('en-GB', { 
        hour12: false 
      }).replace(/:/g, '')}`;

      const { data, error } = await supabase
        .from('migrations')
        .insert({ 
          user_id: user.id,
          project_name: defaultProjectName
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
        return null;
      } else {
        setCurrentMigrationId(data.id);
        toast({
          title: "Migration Started",
          description: `New migration project "${defaultProjectName}" created successfully`,
        });
        return data.id;
      }
    } catch (error) {
      console.error('Error starting new migration:', error);
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred while starting migration",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreatingMigration(false);
    }
  }, [user, toast]);

  // Get or create migration ID
  const getOrCreateMigrationId = useCallback(async (): Promise<string | null> => {
    if (currentMigrationId) {
      return currentMigrationId;
    }

    // Try to get the most recent migration for this user
    const { data: recentMigration } = await supabase
      .from('migrations')
      .select('id')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentMigration?.id) {
      setCurrentMigrationId(recentMigration.id);
      return recentMigration.id;
    }

    // Create new migration if none exists
    return await startNewMigration();
  }, [currentMigrationId, user?.id, startNewMigration]);

  // Handle file upload and save to migration
  const handleCodeUpload = useCallback(async (uploadedFiles: any[]): Promise<FileItem[]> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return [];
    }

    // Ensure a migration exists before uploading files
    const migrationId = await getOrCreateMigrationId();
    if (!migrationId) {
      toast({
        title: "Upload Failed",
        description: "No migration ID available",
        variant: "destructive",
      });
      return [];
    }

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
      // Save files to migration_files table
      for (const file of convertedFiles) {
        const { error: insertError } = await supabase.from('migration_files').insert({
          migration_id: migrationId,
          file_name: file.name,
          file_path: file.path,
          file_type: file.type,
          original_content: file.content,
          conversion_status: 'pending',
        });

        if (insertError) {
          console.error(`Error saving file ${file.name}:`, insertError);
        }
      }

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${convertedFiles.length} file${convertedFiles.length > 1 ? 's' : ''} to migration`,
      });

      return convertedFiles;
    } catch (error) {
      console.error('Error saving files to Supabase:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to save the uploaded files",
        variant: "destructive",
      });
      return convertedFiles; // Return files even if save failed
    }
  }, [user, getOrCreateMigrationId, toast]);

  // Update file conversion status
  const updateFileStatus = useCallback(async (
    fileId: string, 
    status: 'pending' | 'success' | 'failed' | 'deployed',
    convertedContent?: string,
    errorMessage?: string,
    dataTypeMapping?: any,
    performanceMetrics?: any,
    issues?: any
  ) => {
    try {
      const updateData: any = {
        conversion_status: status,
        updated_at: new Date().toISOString(),
      };

      if (convertedContent !== undefined) {
        updateData.converted_content = convertedContent;
      }

      if (errorMessage !== undefined) {
        updateData.error_message = errorMessage;
      }

      if (dataTypeMapping !== undefined) {
        updateData.data_type_mapping = dataTypeMapping;
      }

      if (performanceMetrics !== undefined) {
        updateData.performance_metrics = performanceMetrics;
      }

      if (issues !== undefined) {
        updateData.issues = issues;
      }

      const { error } = await supabase
        .from('migration_files')
        .update(updateData)
        .eq('id', fileId);

      if (error) {
        console.error('Error updating file status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating file status:', error);
      return false;
    }
  }, []);

  // Mark file as deployed
  const markFileAsDeployed = useCallback(async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('migration_files')
        .update({
          conversion_status: 'deployed',
          deployment_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);

      if (error) {
        console.error('Error marking file as deployed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking file as deployed:', error);
      return false;
    }
  }, []);

  // Save deployment log
  const saveDeploymentLog = useCallback(async (
    status: 'Success' | 'Failed',
    linesOfSql: number,
    fileCount: number,
    errorMessage?: string,
    migrationId?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .insert({
          user_id: user.id,
          migration_id: migrationId || currentMigrationId,
          status,
          lines_of_sql: linesOfSql,
          file_count: fileCount,
          error_message: errorMessage || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving deployment log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving deployment log:', error);
      return null;
    }
  }, [user, currentMigrationId]);

  // Get migration details
  const getMigrationDetails = useCallback(async (migrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('migrations')
        .select(`
          *,
          migration_files (*)
        `)
        .eq('id', migrationId)
        .single();

      if (error) {
        console.error('Error fetching migration details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching migration details:', error);
      return null;
    }
  }, []);

  // Update migration project name
  const updateMigrationName = useCallback(async (migrationId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('migrations')
        .update({
          project_name: newName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', migrationId);

      if (error) {
        console.error('Error updating migration name:', error);
        return false;
      }

      toast({
        title: "Migration Updated",
        description: `Migration name updated to "${newName}"`,
      });

      return true;
    } catch (error) {
      console.error('Error updating migration name:', error);
      return false;
    }
  }, [toast]);

  // Delete migration and all associated files
  const deleteMigration = useCallback(async (migrationId: string) => {
    try {
      // Delete migration files first
      const { error: filesError } = await supabase
        .from('migration_files')
        .delete()
        .eq('migration_id', migrationId);

      if (filesError) {
        console.error('Error deleting migration files:', filesError);
        return false;
      }

      // Delete migration
      const { error: migrationError } = await supabase
        .from('migrations')
        .delete()
        .eq('id', migrationId);

      if (migrationError) {
        console.error('Error deleting migration:', migrationError);
        return false;
      }

      // Clear current migration if it's the one being deleted
      if (currentMigrationId === migrationId) {
        setCurrentMigrationId(null);
      }

      toast({
        title: "Migration Deleted",
        description: "Migration and all associated files have been deleted",
      });

      return true;
    } catch (error) {
      console.error('Error deleting migration:', error);
      return false;
    }
  }, [currentMigrationId, toast]);

  // Get all migrations for current user
  const getUserMigrations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('migrations')
        .select(`
          *,
          migration_files (
            id,
            conversion_status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user migrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user migrations:', error);
      return [];
    }
  }, [user]);

  // Get migration statistics
  const getMigrationStats = useCallback(async (migrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('migration_files')
        .select('conversion_status')
        .eq('migration_id', migrationId);

      if (error) {
        console.error('Error fetching migration stats:', error);
        return null;
      }

      const files = data || [];
      return {
        total: files.length,
        success: files.filter(f => f.conversion_status === 'success').length,
        failed: files.filter(f => f.conversion_status === 'failed').length,
        pending: files.filter(f => f.conversion_status === 'pending').length,
        deployed: files.filter(f => f.conversion_status === 'deployed').length,
      };
    } catch (error) {
      console.error('Error fetching migration stats:', error);
      return null;
    }
  }, []);

  return {
    // State
    currentMigrationId,
    isCreatingMigration,
    
    // Actions
    startNewMigration,
    getOrCreateMigrationId,
    handleCodeUpload,
    updateFileStatus,
    markFileAsDeployed,
    saveDeploymentLog,
    getMigrationDetails,
    updateMigrationName,
    deleteMigration,
    getUserMigrations,
    getMigrationStats,
    
    // Setters
    setCurrentMigrationId,
  };
};

export default useMigrationManager; 