import { supabase } from '@/integrations/supabase/client';
import { RewritePrompt } from '@/types';

const MAX_STORED_PROMPTS = 10;

export const rewritePromptsService = {
  /**
   * Store a new rewrite prompt
   */
  async storePrompt(migrationFileId: string, promptText: string, userId: string): Promise<RewritePrompt | null> {
    try {
      const { data, error } = await supabase
        .from('rewrite_prompts')
        .insert({
          migration_file_id: migrationFileId,
          prompt_text: promptText,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing rewrite prompt:', error);
        return null;
      }

      return {
        id: data.id,
        migrationFileId: data.migration_file_id,
        promptText: data.prompt_text,
        createdAt: data.created_at,
        userId: data.user_id
      };
    } catch (error) {
      console.error('Error storing rewrite prompt:', error);
      return null;
    }
  },

  /**
   * Get the count of stored prompts
   */
  async getPromptCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('rewrite_prompts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting prompt count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting prompt count:', error);
      return 0;
    }
  },

  /**
   * Get all stored prompts
   */
  async getAllPrompts(): Promise<RewritePrompt[]> {
    try {
      const { data, error } = await supabase
        .from('rewrite_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all prompts:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        migrationFileId: item.migration_file_id,
        promptText: item.prompt_text,
        createdAt: item.created_at,
        userId: item.user_id
      }));
    } catch (error) {
      console.error('Error getting all prompts:', error);
      return [];
    }
  },

  /**
   * Clear all stored prompts
   */
  async clearAllPrompts(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rewrite_prompts')
        .delete()
        .gt('id', '0'); // Delete all records

      if (error) {
        console.error('Error clearing prompts:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing prompts:', error);
      return false;
    }
  },

  /**
   * Check if the prompt quota has been reached
   */
  async isQuotaReached(): Promise<boolean> {
    const count = await this.getPromptCount();
    return count >= MAX_STORED_PROMPTS;
  }
};