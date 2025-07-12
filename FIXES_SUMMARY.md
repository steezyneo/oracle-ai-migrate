# Fixes Summary for "Mark for Review" Issue

## Problem
When clicking "Mark for Review", files were still showing as "Success" in the history instead of showing as "Pending Review", and the deploy column was still present.

## Root Cause
1. Database migration for `pending_review` status was not applied
2. Interface types were not updated consistently
3. History system still had deploy-related columns and filters

## Fixes Applied

### 1. Database Migration (CRITICAL - Must be applied first)
**File:** `apply-migration-instructions.md`

You MUST run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing constraint
ALTER TABLE public.migration_files 
DROP CONSTRAINT IF EXISTS migration_files_conversion_status_check;

-- Add the new constraint with 'pending_review' status
ALTER TABLE public.migration_files 
ADD CONSTRAINT migration_files_conversion_status_check 
CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed', 'pending_review'));
```

### 2. ConversionViewer Component Updates
**File:** `src/components/ConversionViewer.tsx`
- Updated `FileItem` interface to include `pending_review` status
- Modified `handleMarkAsUnreviewed` to update file status to `pending_review` in database
- Added proper error handling and success messages

### 3. HistorySystem Component Updates
**File:** `src/components/HistorySystem.tsx`
- Updated `Migration` interface to include `pending_review_count` and removed `deployed_count`
- Updated `MigrationFile` interface to include `pending_review` status and removed `deployed`
- Modified `fetchHistory` to count pending review files
- Updated `getStatusIcon` and `getStatusColor` to handle pending review status
- Removed deploy column from history table
- Changed filter from "Deployed Only" to "Pending Review Only"
- Updated table headers and data display

### 4. FileTreeView Component Updates
**File:** `src/components/FileTreeView.tsx`
- Added `Clock` icon import
- Updated `FileItem` interface to include `pending_review` status
- Modified `getStatusIcon` to show clock for pending review
- Updated status filter to include "Pending Review" option
- Added visual indicators for pending review files

### 5. Type Definitions Updates
**File:** `src/types/index.ts`
- Updated `FileItem` interface to include `pending_review` status

## How It Works Now

1. **When you click "Mark for Review"**:
   - File is added to `unreviewed_files` table (for pending actions)
   - File status in `migration_files` is changed from `success` to `pending_review`
   - File shows as "Pending Review" in history instead of "Success"

2. **In the History page**:
   - Files marked for review show with yellow clock icon
   - They have "Pending Review" status instead of "Success"
   - Migration summary includes count of pending review files
   - No more deploy column or deploy filters

3. **In the File Tree**:
   - Files marked for review show with yellow clock icon
   - They display "(Marked for Review)" next to filename
   - You can filter by "Pending Review" status

## Next Steps

1. **Apply the database migration FIRST** (see `apply-migration-instructions.md`)
2. **Test the functionality**:
   - Upload files and convert them
   - Click "Mark for Review" on a converted file
   - Check that file shows as "Pending Review" in history
   - Verify file appears in Pending Actions tab

## Expected Behavior After Fixes

- ✅ Files marked for review show as "Pending Review" instead of "Success"
- ✅ History table shows "Pending Review" column instead of "Deployed"
- ✅ Filter dropdown shows "Pending Review Only" instead of "Deployed Only"
- ✅ Files in pending actions work correctly
- ✅ No more confusion between successful and pending review files 