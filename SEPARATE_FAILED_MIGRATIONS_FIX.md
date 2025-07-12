# Fix: Separate Migrations for Failed Files

## Problem
When files failed to convert, they were being added to the same migration as successful files, causing all failed files to appear in the same row in the history tab. Users wanted each failed file to have its own separate migration/row.

## Solution
Created a new system where each failed file gets its own dedicated migration with a descriptive name like "Failed: filename.sql".

## Changes Made

### 1. Added New Function to MigrationManager.tsx
**New Function**: `createFailedFileMigration(fileName: string)`

```typescript
// Create a new migration for failed files (separate from main migration)
const createFailedFileMigration = useCallback(async (fileName: string): Promise<string | null> => {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to create migration",
      variant: "destructive",
    });
    return null;
  }

  try {
    setIsCreatingMigration(true);
    
    const projectName = `Failed: ${fileName}`;

    const { data, error } = await supabase
      .from('migrations')
      .insert({ 
        user_id: user.id,
        project_name: projectName
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating failed file migration:', error);
      toast({
        title: "Migration Error",
        description: "Failed to create migration for failed file",
        variant: "destructive",
      });
      return null;
    } else {
      toast({
        title: "Failed File Migration Created",
        description: `Created separate migration for failed file: ${fileName}`,
      });
      return data.id;
    }
  } catch (error) {
    console.error('Error creating failed file migration:', error);
    toast({
      title: "Migration Error",
      description: "An unexpected error occurred while creating failed file migration",
      variant: "destructive",
    });
    return null;
  } finally {
    setIsCreatingMigration(false);
  }
}, [user, toast]);
```

### 2. Updated EnhancedConversionLogic.tsx
**Changed all error handling sections** to use the new function:

**Before**:
```typescript
// Save failed file to database
const migrationId = await migrationManager.getOrCreateMigrationId();
if (migrationId) {
  const { data: existing } = await migrationManager.getMigrationDetails(migrationId);
  const existingFile = existing?.migration_files?.find((f: any) => f.file_name === file.name);
  
  if (existingFile) {
    // Update existing file
    await migrationManager.updateFileStatus(
      existingFile.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  } else {
    // Insert new failed file record
    await migrationManager.handleCodeUpload([{
      id: file.id,
      name: file.name,
      type: file.type,
      content: file.content
    }]);
    
    // Update the newly created file with failed status
    const updatedMigration = await migrationManager.getMigrationDetails(migrationId);
    const newFile = updatedMigration?.migration_files?.find((f: any) => f.file_name === file.name);
    
    if (newFile) {
      await migrationManager.updateFileStatus(
        newFile.id,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
```

**After**:
```typescript
// Save failed file to separate migration
const failedMigrationId = await migrationManager.createFailedFileMigration(file.name);
if (failedMigrationId) {
  // Insert failed file into the new migration
  await supabase.from('migration_files').insert({
    migration_id: failedMigrationId,
    file_name: file.name,
    file_path: file.name,
    file_type: file.type,
    original_content: file.content,
    converted_content: null,
    conversion_status: 'failed',
    error_message: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### 3. Updated ConversionLogic.tsx
**Added the same function and updated all error handling sections**:

- Added `createFailedFileMigration` function
- Added `useAuth` import to get user information
- Updated all error handling to use separate migrations for failed files

## Files Modified

### 1. MigrationManager.tsx
- ✅ Added `createFailedFileMigration` function
- ✅ Added function to return statement

### 2. EnhancedConversionLogic.tsx
- ✅ Added supabase import
- ✅ Updated `handleConvertFile` error handling
- ✅ Updated `handleConvertAllByType` error handling
- ✅ Updated `handleConvertAll` error handling
- ✅ Updated `handleConvertSelected` error handling

### 3. ConversionLogic.tsx
- ✅ Added `useAuth` import
- ✅ Added `createFailedFileMigration` function
- ✅ Updated `handleConvertFile` error handling
- ✅ Updated `handleConvertAllByType` error handling
- ✅ Updated `handleConvertAll` error handling
- ✅ Updated `handleConvertSelected` error handling

## Result

Now when files fail to convert:
- ✅ **Each failed file gets its own migration** with name "Failed: filename.sql"
- ✅ **Failed files appear as separate rows** in the history tab
- ✅ **Clear identification** of which files failed
- ✅ **Proper error messages** stored with each failed file
- ✅ **Better organization** in the history view

## Example History View

**Before**:
```
Migration_123456
├── table1.sql (Success)
├── table2.sql (Failed)
└── table3.sql (Failed)
```

**After**:
```
Migration_123456
└── table1.sql (Success)

Failed: table2.sql
└── table2.sql (Failed)

Failed: table3.sql
└── table3.sql (Failed)
```

## Testing

To test this fix:
1. Upload multiple files, some that will fail conversion
2. Run the conversion process
3. Check the history tab - each failed file should appear in its own separate migration row
4. Verify that failed files have descriptive names like "Failed: filename.sql"

The fix provides much better organization and visibility into failed conversions! 🎉 