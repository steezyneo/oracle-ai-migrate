# Migration History System Implementation

This document explains how to implement the same history logic and migration code storage system from the [oracle-ai-migrate repository](https://github.com/steezyneo/oracle-ai-migrate).

## Overview

The history system provides comprehensive tracking of:
- **Migration Projects** - User-created migration sessions
- **File Conversions** - Individual file conversion status and results
- **Deployment Logs** - Oracle deployment attempts and results
- **Code Comparison** - Side-by-side original vs converted code viewing
- **User-specific Data** - Secure, isolated data per user

## Database Schema

The system uses **Supabase** with the following core tables:

### 1. `migrations` - Migration Projects
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- project_name (TEXT)
- folder_structure (JSONB)
- description (TEXT)
- status (TEXT: 'active', 'completed', 'archived')
- created_at, updated_at (TIMESTAMP)
```

### 2. `migration_files` - Individual Files
```sql
- id (UUID, Primary Key)
- migration_id (UUID, Foreign Key to migrations)
- file_name, file_path (TEXT)
- file_type (TEXT: 'table', 'procedure', 'trigger', 'other')
- original_content, converted_content (TEXT)
- conversion_status (TEXT: 'pending', 'success', 'failed', 'deployed')
- error_message (TEXT)
- deployment_timestamp (TIMESTAMP)
- data_type_mapping, performance_metrics, issues (JSONB)
- created_at, updated_at (TIMESTAMP)
```

### 3. `deployment_logs` - Deployment History
```sql
- id (UUID, Primary Key)
- user_id, migration_id (UUID, Foreign Keys)
- status (TEXT: 'Success', 'Failed')
- lines_of_sql, file_count (INTEGER)
- error_message (TEXT)
- deployment_config (JSONB)
- created_at (TIMESTAMP)
```

### 4. `unreviewed_files` - Files Pending Review
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- file_name (TEXT)
- original_code, converted_code (TEXT)
- status (TEXT: 'unreviewed', 'reviewed')
- created_at, updated_at (TIMESTAMP)
```

## Key Features

### 🔄 **Migration Lifecycle Tracking**
- **Pending** → **Success/Failed** → **Deployed**
- Each status change is timestamped and logged
- Full audit trail of conversion attempts

### 📊 **Comprehensive Statistics**
- File counts by status (pending, success, failed, deployed)
- Migration project summaries
- User-level statistics
- Performance metrics tracking

### 🔒 **Security & Isolation**
- Row Level Security (RLS) ensures user data isolation
- Each user can only access their own migrations
- Secure API endpoints with authentication

### 📱 **Real-time Updates**
- Supabase realtime subscriptions
- Live updates across multiple browser tabs
- Instant status changes and notifications

## Implementation Guide

### 1. Database Setup

Run the complete schema from `database-schema.sql`:

```bash
# Apply the schema to your Supabase project
psql -h your-project.supabase.co -U postgres -d postgres -f database-schema.sql
```

### 2. Core Components

#### A. Migration Manager (`src/components/MigrationManager.tsx`)
```typescript
const migrationManager = useMigrationManager();

// Start new migration
const migrationId = await migrationManager.startNewMigration("My Project");

// Upload files
const files = await migrationManager.handleCodeUpload(uploadedFiles);

// Update file status
await migrationManager.updateFileStatus(fileId, 'success', convertedCode);
```

#### B. History System (`src/components/HistorySystem.tsx`)
```typescript
// Display migration history
<HistorySystem />

// Features:
// - Migration project listing
// - File status tracking
// - Code comparison viewer
// - Deployment logs
// - Export/download functionality
```

#### C. Enhanced Conversion Logic (`src/components/EnhancedConversionLogic.tsx`)
```typescript
const conversionLogic = useEnhancedConversionLogic(
  files, setFiles, setResults, aiModel, customPrompt
);

// Automatically saves conversion results to history
await conversionLogic.handleConvertFile(fileId);
```

### 3. Integration Points

#### A. File Upload Flow
```typescript
// 1. User uploads files
const uploadedFiles = await handleFileUpload();

// 2. Create migration project
const migrationId = await migrationManager.startNewMigration();

// 3. Save files to migration
const files = await migrationManager.handleCodeUpload(uploadedFiles);

// 4. Files are now tracked in history
```

#### B. Conversion Flow
```typescript
// 1. Convert file with AI
const result = await convertSybaseToOracle(file, aiModel);

// 2. Update file status in database
await migrationManager.updateFileStatus(
  fileId,
  'success',
  result.convertedCode,
  undefined,
  result.dataTypeMapping,
  result.performance,
  result.issues
);

// 3. File appears in history with full details
```

#### C. Deployment Flow
```typescript
// 1. Deploy to Oracle
const deployResult = await deployToOracle(config, convertedCode);

// 2. Mark file as deployed
await migrationManager.markFileAsDeployed(fileId);

// 3. Save deployment log
await migrationManager.saveDeploymentLog(
  deployResult.success ? 'Success' : 'Failed',
  linesOfSql,
  fileCount,
  deployResult.error
);
```

### 4. History Page Integration

Add the history route to your app:

```typescript
// src/App.tsx
import HistorySystem from './components/HistorySystem';

<Route path="/history" element={<HistorySystem />} />
```

## Usage Examples

### Creating a New Migration
```typescript
const { startNewMigration } = useMigrationManager();

const handleNewMigration = async () => {
  const migrationId = await startNewMigration("Sybase Legacy Migration");
  if (migrationId) {
    console.log("Migration created:", migrationId);
    // Navigate to upload page
  }
};
```

### Tracking File Conversions
```typescript
const { updateFileStatus } = useMigrationManager();

const handleConversion = async (file, result) => {
  await updateFileStatus(
    file.id,
    result.status === 'success' ? 'success' : 'failed',
    result.convertedCode,
    result.error,
    result.dataTypeMapping,
    result.performance,
    result.issues
  );
};
```

### Viewing Migration History
```typescript
// The HistorySystem component automatically:
// 1. Fetches user's migrations
// 2. Shows file status counts
// 3. Provides code comparison
// 4. Tracks deployment logs
```

## Advanced Features

### 1. Migration Statistics
```typescript
const { getMigrationStats } = useMigrationManager();

const stats = await getMigrationStats(migrationId);
// Returns: { total, success, failed, pending, deployed }
```

### 2. User Summary
```typescript
const { getUserMigrations } = useMigrationManager();

const migrations = await getUserMigrations();
// Returns all user migrations with file counts
```

### 3. Code Comparison
```typescript
// Built into HistorySystem component
<CodeComparison
  originalCode={file.original_content}
  convertedCode={file.converted_content}
  fileName={file.file_name}
/>
```

### 4. Deployment Tracking
```typescript
const { saveDeploymentLog, markFileAsDeployed } = useMigrationManager();

// After successful deployment
await markFileAsDeployed(fileId);
await saveDeploymentLog('Success', linesOfSql, fileCount);
```

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- No cross-user data leakage
- Secure API endpoints

### Data Validation
- File type validation (`table`, `procedure`, `trigger`, `other`)
- Status validation (`pending`, `success`, `failed`, `deployed`)
- UUID validation for all foreign keys

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful fallbacks for failed operations

## Performance Optimizations

### Database Indexes
- Optimized indexes on frequently queried columns
- Composite indexes for complex queries
- Efficient foreign key relationships

### Caching Strategy
- React Query for client-side caching
- Optimistic updates for better UX
- Background data synchronization

### Real-time Updates
- Supabase realtime subscriptions
- Efficient change detection
- Minimal network overhead

## Troubleshooting

### Common Issues

1. **Migration not appearing in history**
   - Check if `migrationId` is properly set
   - Verify RLS policies are working
   - Ensure user authentication is valid

2. **File status not updating**
   - Check `updateFileStatus` function calls
   - Verify file exists in database
   - Check for constraint violations

3. **Deployment logs missing**
   - Ensure `saveDeploymentLog` is called
   - Check user_id is properly set
   - Verify deployment status values

### Debug Queries
```sql
-- Check user migrations
SELECT * FROM migrations WHERE user_id = 'your-user-id';

-- Check file status
SELECT * FROM migration_files WHERE migration_id = 'migration-id';

-- Check deployment logs
SELECT * FROM deployment_logs WHERE user_id = 'your-user-id';
```

## Migration from Existing System

If you have an existing system without history tracking:

1. **Backup existing data**
2. **Apply the new schema**
3. **Migrate existing files** to the new structure
4. **Update your components** to use the new hooks
5. **Test thoroughly** with the new history system

## Conclusion

This history system provides a robust, scalable solution for tracking migration projects. It includes:

- ✅ Complete migration lifecycle tracking
- ✅ Secure user data isolation
- ✅ Real-time updates and notifications
- ✅ Comprehensive statistics and reporting
- ✅ Code comparison and export features
- ✅ Deployment tracking and logging

The system is designed to be production-ready with proper security, performance optimizations, and comprehensive error handling. 