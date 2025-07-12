# Migration Separation Fix - Failed Files Stay in Original Migration

## Problem
Previously, when files failed to convert, they were being moved to separate migration rows, creating confusion and making it difficult to track which files belonged to which original migration.

## Solution
Modified the system so that failed files stay within their original migration instead of being moved to separate migrations.

## Changes Made

### 1. MigrationManager.tsx
**Updated `createFailedFileMigration` function:**
- Added `originalMigrationId` parameter
- If `originalMigrationId` is provided, use that instead of creating a new migration
- This ensures failed files stay in their original migration

```typescript
const createFailedFileMigration = useCallback(async (fileName: string, originalMigrationId?: string): Promise<string | null> => {
  // If we have an original migration ID, use that instead of creating a new one
  if (originalMigrationId) {
    console.log(`[MIGRATION] Using original migration ${originalMigrationId} for failed file: ${fileName}`);
    return originalMigrationId;
  }
  // ... rest of function for creating new migrations when needed
}, [user, toast]);
```

### 2. EnhancedConversionLogic.tsx
**Updated all error handling sections:**
- `handleConvertFile`
- `handleConvertAllByType`
- `handleConvertAll`
- `handleConvertSelected`

**Before:**
```typescript
// Save failed file to separate migration
const failedMigrationId = await migrationManager.createFailedFileMigration(file.name);
```

**After:**
```typescript
// Get the current migration ID and save failed file to the same migration
const currentMigrationId = await migrationManager.getOrCreateMigrationId();
const failedMigrationId = await migrationManager.createFailedFileMigration(file.name, currentMigrationId);
```

### 3. ConversionLogic.tsx
**Updated all error handling sections:**
- `handleConvertFile`
- `handleConvertAllByType`
- `handleConvertAll`
- `handleConvertSelected`

**Before:**
```typescript
// Save failed file to separate migration
const failedMigrationId = await createFailedFileMigration(file.name);
```

**After:**
```typescript
// Save failed file to the same migration (not separate)
const failedMigrationId = await createFailedFileMigration(file.name, migrationId);
```

## Result
Now when files fail to convert:
1. **Failed files stay in their original migration** - they don't create separate migration rows
2. **Each migration shows both successful and failed files** - complete picture of the migration
3. **Better organization** - users can see which files succeeded and which failed within the same migration
4. **Easier tracking** - all files from one upload session stay together

## Migration Structure
- **Migration 1**: Contains successful files A, B, C and failed file D
- **Migration 2**: Contains successful files E, F and failed file G
- **Migration 3**: Contains only failed files H, I (if no successful files in that session)

This provides a much cleaner and more logical organization where each migration represents a complete conversion session with all its outcomes. 