# 🚨 URGENT: Database Migration Required

## The "Mark for Review" functionality will NOT work until you run this migration!

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run This SQL Script
Copy and paste this EXACT code into the SQL Editor:

```sql
-- URGENT: Add pending_review status to database
-- This MUST be run for "Mark for Review" to work properly

-- Drop the existing constraint
ALTER TABLE public.migration_files 
DROP CONSTRAINT IF EXISTS migration_files_conversion_status_check;

-- Add the new constraint with 'pending_review' status
ALTER TABLE public.migration_files 
ADD CONSTRAINT migration_files_conversion_status_check 
CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed', 'pending_review'));

-- Verify the change worked
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'migration_files' AND column_name = 'conversion_status';
```

### Step 3: Click "Run"
Click the "Run" button to execute the script.

### Step 4: Verify Success
You should see output showing the conversion_status column details.

## ⚠️ IMPORTANT: Without this migration, files will always show as "Success" even when marked for review! 