-- Migration to add 'pending_review' status to conversion_status
-- This allows files to be marked as pending review instead of showing as success

-- Drop the existing constraint
ALTER TABLE public.migration_files 
DROP CONSTRAINT IF EXISTS migration_files_conversion_status_check;

-- Add the new constraint with 'pending_review' status
ALTER TABLE public.migration_files 
ADD CONSTRAINT migration_files_conversion_status_check 
CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed', 'pending_review'));

-- Add comment to document the new status
COMMENT ON COLUMN public.migration_files.conversion_status IS 'File conversion status: pending, success, failed, deployed, or pending_review (marked for review)'; 