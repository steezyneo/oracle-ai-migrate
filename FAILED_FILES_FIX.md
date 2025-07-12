# Fix for Failed Files Not Saving to History

## Problem
Failed/unsuccessful files were not being saved to the migration history. Only successful conversions were being stored in the database, which meant failed files would disappear from the history tab.

## Root Cause
The conversion logic was only saving files to the database when they were successfully converted. When a file failed to convert, the code would only update the local state but not save the failed file record to the database.

## Solution Applied

### 1. EnhancedConversionLogic.tsx
Updated all error handling sections in:
- `handleConvertFile` function
- `handleConvertAllByType` function  
- `handleConvertAll` function
- `handleConvertSelected` function

### 2. ConversionLogic.tsx
Updated all error handling sections in:
- `handleConvertFile` function
- `handleConvertAllByType` function
- `handleConvertAll` function
- `handleConvertSelected` function

## Changes Made

### Before (Problematic Code)
```typescript
} catch (error) {
  console.error('Conversion failed:', error);
  setFiles(prev => prev.map(f => 
    f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
  ));
  
  // Update status to failed in database
  await supabase.from('migration_files').update({
    conversion_status: 'failed',
    error_message: error instanceof Error ? error.message : 'Unknown error'
  }).eq('id', file.id); // This would fail if file doesn't exist in DB
}
```

### After (Fixed Code)
```typescript
} catch (error) {
  console.error('Conversion failed:', error);
  setFiles(prev => prev.map(f => 
    f.id === fileId ? { ...f, conversionStatus: 'failed' } : f
  ));
  
  // Save failed file to database
  if (migrationId) {
    // Check if file already exists for this migration
    const { data: existing, error: fetchError } = await supabase
      .from('migration_files')
      .select('id')
      .eq('migration_id', migrationId)
      .eq('file_name', file.name)
      .single();
    
    if (existing && existing.id) {
      // Update existing record
      await supabase.from('migration_files').update({
        conversion_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }).eq('id', existing.id);
    } else {
      // Insert new failed file record
      await supabase.from('migration_files').insert({
        migration_id: migrationId,
        file_name: file.name,
        file_path: file.name,
        file_type: file.type,
        original_content: file.content,
        converted_content: null,
        conversion_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

## Key Improvements

1. **Check for Existing File**: Before trying to update, check if the file already exists in the database
2. **Insert New Record**: If the file doesn't exist, create a new record with failed status
3. **Proper Error Handling**: Ensure failed files are always saved regardless of whether they were previously uploaded
4. **Consistent Behavior**: All conversion functions now handle failed files the same way

## Result
Now when files fail to convert:
- They will be saved to the database with `conversion_status: 'failed'`
- They will appear in the history tab with proper error messages
- Users can see which files failed and why
- Failed files are preserved for debugging and retry purposes

## Testing
To test this fix:
1. Upload some files that are likely to fail conversion (e.g., invalid SQL syntax)
2. Run the conversion
3. Check the history tab - failed files should now appear with "Failed" status
4. Verify that error messages are properly stored and displayed 