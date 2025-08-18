-- Migration to add the rewrite_prompts table for storing user-submitted AI rewrite prompts
-- This table stores prompts submitted by users when requesting AI rewrites
-- It includes relationships to migration_files and users tables
-- The table has RLS policies to allow users to manage their own prompts and admins to view/delete all prompts

CREATE TABLE rewrite_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_file_id UUID REFERENCES migration_files(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_rewrite_prompts_user_id ON rewrite_prompts(user_id);
CREATE INDEX idx_rewrite_prompts_created_at ON rewrite_prompts(created_at);

ALTER TABLE rewrite_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own rewrite prompts" 
ON rewrite_prompts
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all rewrite prompts"
ON rewrite_prompts
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Allow admins to delete all rewrite prompts"
ON rewrite_prompts
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));