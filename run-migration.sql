-- Migration to add 'pending_review' status to conversion_status
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.migration_files 
DROP CONSTRAINT IF EXISTS migration_files_conversion_status_check;

-- Add the new constraint with 'pending_review' status
ALTER TABLE public.migration_files 
ADD CONSTRAINT migration_files_conversion_status_check 
CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed', 'pending_review'));

-- Add comment to document the new status
COMMENT ON COLUMN public.migration_files.conversion_status IS 'File conversion status: pending, success, failed, deployed, or pending_review (marked for review)';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'migration_files' AND column_name = 'conversion_status'; 