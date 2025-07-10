// Script to clear all migration history
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllHistory() {
  try {
    console.log('Clearing all migration history...');
    
    // Delete all deployment logs
    const { error: deploymentError } = await supabase
      .from('deployment_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deploymentError) {
      console.error('Error deleting deployment logs:', deploymentError);
    } else {
      console.log('✅ Deleted all deployment logs');
    }
    
    // Delete all migration files
    const { error: filesError } = await supabase
      .from('migration_files')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (filesError) {
      console.error('Error deleting migration files:', filesError);
    } else {
      console.log('✅ Deleted all migration files');
    }
    
    // Delete all migrations
    const { error: migrationError } = await supabase
      .from('migrations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (migrationError) {
      console.error('Error deleting migrations:', migrationError);
    } else {
      console.log('✅ Deleted all migrations');
    }
    
    console.log('🎉 All migration history cleared successfully!');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

clearAllHistory(); 