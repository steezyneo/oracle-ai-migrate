import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UnreviewedFile, UnreviewedFileInsert, UnreviewedFileUpdate } from '@/types/unreviewedFiles';

// Hook for managing unreviewed files for the current user
export const useUnreviewedFiles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreviewedFiles, setUnreviewedFiles] = useState<UnreviewedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all unreviewed files for this user
  const fetchUnreviewedFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unreviewed_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'unreviewed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUnreviewedFiles((data || []) as UnreviewedFile[]);
    } catch (error) {
      console.error('Error fetching unreviewed files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch unreviewed files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a file to the unreviewed list
  const addUnreviewedFile = async (fileData: UnreviewedFileInsert) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('unreviewed_files')
        .insert({
          ...fileData,
          user_id: user.id,
          status: 'unreviewed',
          original_code: fileData.original_code,
        });
      if (error) throw error;
      toast({
        title: "File Marked as Unreviewed",
        description: `${fileData.file_name} has been added to your pending actions.`,
      });
      // Refresh the list after adding
      await fetchUnreviewedFiles();
      return true;
    } catch (error) {
      console.error('Error adding unreviewed file:', error);
      toast({
        title: "Error",
        description: "Failed to mark file as unreviewed",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update an unreviewed file (e.g., after editing)
  const updateUnreviewedFile = async (updateData: UnreviewedFileUpdate) => {
    try {
      const { error } = await supabase
        .from('unreviewed_files')
        .update({
          converted_code: updateData.converted_code,
          original_code: updateData.original_code,
          status: updateData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', updateData.id);
      if (error) throw error;
      toast({
        title: "File Updated",
        description: "The file has been updated successfully.",
      });
      // Refresh the list after update
      await fetchUnreviewedFiles();
      return true;
    } catch (error) {
      console.error('Error updating unreviewed file:', error);
      toast({
        title: "Error",
        description: "Failed to update file",
        variant: "destructive",
      });
      return false;
    }
  };

  // Mark a file as reviewed and move it to migration history
  const markAsReviewed = async (id: string, fileName: string, convertedCode: string) => {
    if (!user) return false;
    try {
      // Fetch the original code for this file
      const { data: unreviewedFileData, error: fetchError } = await supabase
        .from('unreviewed_files')
        .select('original_code')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      const originalCode = unreviewedFileData?.original_code || '';
      // Add to migration history (new migration for each reviewed file)
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user.id,
          project_name: `Reviewed: ${fileName}`
        })
        .select()
        .single();
      if (migrationError) throw migrationError;
      // Add the reviewed file to migration_files
      const { error: fileError } = await supabase
        .from('migration_files')
        .insert({
          migration_id: migration.id,
          file_name: fileName,
          file_path: fileName,
          file_type: 'other',
          converted_content: convertedCode,
          original_content: originalCode,
          conversion_status: 'success'
        });
      if (fileError) throw fileError;
      // Mark the unreviewed file as reviewed
      const success = await updateUnreviewedFile({
        id,
        status: 'reviewed'
      });
      if (success) {
        toast({
          title: "File Reviewed",
          description: `${fileName} has been marked as reviewed and added to history.`,
        });
      }
      return success;
    } catch (error) {
      console.error('Error marking file as reviewed:', error);
      toast({
        title: "Error",
        description: "Failed to mark file as reviewed",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete an unreviewed file from the list
  const deleteUnreviewedFile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('unreviewed_files')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "File Deleted",
        description: "The unreviewed file has been removed.",
      });
      // Refresh the list after deletion
      await fetchUnreviewedFiles();
      return true;
    } catch (error) {
      console.error('Error deleting unreviewed file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
      return false;
    }
  };

  // Fetch unreviewed files on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchUnreviewedFiles();
    }
  }, [user]);

  return {
    unreviewedFiles,
    isLoading,
    addUnreviewedFile,
    updateUnreviewedFile,
    markAsReviewed,
    deleteUnreviewedFile,
    refreshUnreviewedFiles: fetchUnreviewedFiles
  };
};