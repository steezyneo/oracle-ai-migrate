-- Migration to add 'deployed' status and clear existing history
-- This migration will:
-- 1. Clear all existing migration data
-- 2. Update the conversion_status constraint to include 'deployed'
-- 3. Ensure clean history going forward

-- First, clear all existing migration data to start fresh
DELETE FROM public.deployment_logs;
DELETE FROM public.migration_files;
DELETE FROM public.migrations;

-- Drop the existing constraint
ALTER TABLE public.migration_files 
DROP CONSTRAINT IF EXISTS migration_files_conversion_status_check;

-- Add the new constraint with 'deployed' status
ALTER TABLE public.migration_files 
ADD CONSTRAINT migration_files_conversion_status_check 
CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed'));

-- Add deployment_timestamp column to migration_files if not exists
ALTER TABLE public.migration_files ADD COLUMN IF NOT EXISTS deployment_timestamp TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on (migration_id, file_name)
ALTER TABLE public.migration_files ADD CONSTRAINT migration_files_unique_file_per_migration UNIQUE (migration_id, file_name);

-- Update the deployment_logs table to include user_id if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deployment_logs' AND column_name = 'user_id') THEN
        ALTER TABLE public.deployment_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update the deployment_logs table to include migration_id if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deployment_logs' AND column_name = 'migration_id') THEN
        ALTER TABLE public.deployment_logs ADD COLUMN migration_id UUID REFERENCES public.migrations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add RLS policies for deployment_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deployment_logs' AND policyname = 'Users can view their own deployment logs') THEN
        CREATE POLICY "Users can view their own deployment logs" 
        ON public.deployment_logs 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deployment_logs' AND policyname = 'Users can create their own deployment logs') THEN
        CREATE POLICY "Users can create their own deployment logs" 
        ON public.deployment_logs 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deployment_logs' AND policyname = 'Users can delete their own deployment logs') THEN
        CREATE POLICY "Users can delete their own deployment logs" 
        ON public.deployment_logs 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on deployment_logs if not already enabled
ALTER TABLE public.deployment_logs ENABLE ROW LEVEL SECURITY;

-- Add deployment_logs to realtime if not already added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'deployment_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_logs;
    END IF;
END $$; 