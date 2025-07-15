import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UnreviewedFile, UnreviewedFileInsert, UnreviewedFileUpdate } from '@/types/unreviewedFiles';

export const useUnreviewedFiles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreviewedFiles, setUnreviewedFiles] = useState<UnreviewedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unreviewed files for the current user
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

  // Add a file to unreviewed files
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

      // Refresh the list
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

  // Update an unreviewed file
  const updateUnreviewedFile = async (updateData: UnreviewedFileUpdate) => {
    try {
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };
      if (updateData.converted_code !== undefined) updateFields.converted_code = updateData.converted_code;
      if (updateData.original_code !== undefined) updateFields.original_code = updateData.original_code;
      if (updateData.status !== undefined) updateFields.status = updateData.status;

      const { error } = await supabase
        .from('unreviewed_files')
        .update(updateFields)
        .eq('id', updateData.id);

      if (error) throw error;

      toast({
        title: "File Updated",
        description: "The file has been updated successfully.",
      });

      // Refresh the list
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

  // Mark a file as reviewed (do NOT move to history yet)
  const markAsReviewed = async (id: string, fileName: string, convertedCode: string, originalCode: string) => {
    if (!user) return false;
    try {
      // Only update the unreviewed file status to 'reviewed'
      const success = await updateUnreviewedFile({
        id,
        status: 'reviewed',
        converted_code: convertedCode,
        original_code: originalCode,
      });
      if (success) {
        toast({
          title: "File Reviewed",
          description: `${fileName} has been marked as reviewed.`,
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

  // Delete an unreviewed file
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

      // Refresh the list
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
//