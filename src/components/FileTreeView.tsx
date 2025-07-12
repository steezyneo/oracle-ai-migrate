import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Database, 
  Zap, 
  GitBranch,
  Check,
  X,
  Play,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileItem, DatabaseNode } from '@/types';

interface FileTreeViewProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onConvertFile: (fileId: string) => void;
  onConvertAllByType: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll: () => void;
  onFixFile: (fileId: string) => void;
  selectedFile: FileItem | null;
  isConverting?: boolean;
  convertingFileIds?: string[];
  onClear?: () => void;
}

const FileTreeView: React.FC<FileTreeViewProps> = ({
  files,
  onFileSelect,
  onConvertFile,
  onConvertAllByType,
  onConvertAll,
  onFixFile,
  selectedFile,
  isConverting = false,
  convertingFileIds = [],
  onClear
}) => {
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleDatabase = (databaseName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(databaseName)) {
      newExpanded.delete(databaseName);
    } else {
      newExpanded.add(databaseName);
    }
    setExpandedDatabases(newExpanded);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const organizeFilesByDatabase = (): DatabaseNode[] => {
    const databaseMap = new Map<string, FileItem[]>();
    
    files.forEach(file => {
      const dbName = file.databaseName || 'default';
      if (!databaseMap.has(dbName)) {
        databaseMap.set(dbName, []);
      }
      databaseMap.get(dbName)!.push(file);
    });
    
    return Array.from(databaseMap.entries()).map(([dbName, dbFiles]) => ({
      name: dbName,
      files: dbFiles
    }));
  };

  const getFilesByType = (files: FileItem[], type: string) => {
    return files.filter(file => file.type === type);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed', fileId: string) => {
    if (convertingFileIds.includes(fileId)) {
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
    
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Play className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'tables':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'procedures':
        return <Zap className="h-4 w-4 text-purple-600" />;
      case 'triggers':
        return <GitBranch className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPendingFilesCount = (sectionFiles: FileItem[]) => {
    return sectionFiles.filter(f => f.conversionStatus === 'pending').length;
  };

  const getTotalPendingFiles = () => {
    return files.filter(f => f.conversionStatus === 'pending').length;
  };

  const renderFileItem = (file: FileItem) => (
    <div
      key={file.id}
      className={cn(
        "flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer group",
        selectedFile?.id === file.id && "bg-blue-50 border border-blue-200"
      )}
      onClick={() => onFileSelect(file)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className={cn(
          "text-sm truncate",
          file.conversionStatus === 'success' && "text-green-700",
          file.conversionStatus === 'failed' && "text-red-700"
        )}>
          {file.name}
        </span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {getStatusIcon(file.conversionStatus, file.id)}
        {file.conversionStatus === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onConvertFile(file.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 h-6"
          >
            Convert
          </Button>
        )}
        {file.conversionStatus === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onFixFile(file.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 h-6 text-red-600 border-red-200 hover:bg-red-50"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Fix
          </Button>
        )}
      </div>
    </div>
  );

  const renderSection = (sectionKey: string, sectionTitle: string, sectionFiles: FileItem[], databaseName: string) => {
    const isExpanded = expandedSections.has(`${databaseName}-${sectionKey}`);
    const pendingCount = getPendingFilesCount(sectionFiles);
    const typeKey = sectionKey === 'tables' ? 'table' : 
                   sectionKey === 'procedures' ? 'procedure' : 
                   sectionKey === 'triggers' ? 'trigger' : 'other';
    
    if (sectionFiles.length === 0) return null;
    
    return (
      <div key={sectionKey} className="mb-2">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(`${databaseName}-${sectionKey}`)}
            className="flex-1 justify-start p-0 h-auto font-medium"
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 mr-2" /> : 
              <ChevronRight className="h-4 w-4 mr-2" />
            }
            {getSectionIcon(sectionKey)}
            <span className="ml-2">{sectionTitle} ({sectionFiles.length})</span>
          </Button>
          
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConvertAllByType(typeKey as 'table' | 'procedure' | 'trigger' | 'other')}
              className="text-xs px-2 py-1 h-6"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Convert All ({pendingCount})
            </Button>
          )}
        </div>
        
        {isExpanded && (
          <div className="ml-4 space-y-1">
            {sectionFiles.map(renderFileItem)}
          </div>
        )}
      </div>
    );
  };

  const renderDatabase = (database: DatabaseNode) => {
    const isExpanded = expandedDatabases.has(database.name);
    const tables = getFilesByType(database.files, 'table');
    const procedures = getFilesByType(database.files, 'procedure');
    const triggers = getFilesByType(database.files, 'trigger');
    const others = getFilesByType(database.files, 'other');
    
    const totalFiles = database.files.length;
    const pendingFiles = database.files.filter(f => f.conversionStatus === 'pending').length;

    return (
      <div key={database.name} className="mb-4">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDatabase(database.name)}
            className="flex-1 justify-start p-0 h-auto font-medium"
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 mr-2" /> : 
              <ChevronRight className="h-4 w-4 mr-2" />
            }
            <Server className="h-4 w-4 text-indigo-600" />
            <span className="ml-2">{database.name} ({totalFiles} files)</span>
            {pendingFiles > 0 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {pendingFiles} pending
              </span>
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-1">
            {renderSection('tables', 'Tables', tables, database.name)}
            {renderSection('procedures', 'Procedures', procedures, database.name)}
            {renderSection('triggers', 'Triggers', triggers, database.name)}
            {others.length > 0 && renderSection('other', 'Other Files', others, database.name)}
          </div>
        )}
      </div>
    );
  };

  const databases = organizeFilesByDatabase();
  const totalPending = getTotalPendingFiles();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Structure</CardTitle>
          <div className="flex gap-2">
            {onClear && files.length > 0 && (
              <Button variant="destructive" onClick={onClear} className="text-xs px-3 py-1 h-7">
                Clear
              </Button>
            )}
            {getTotalPendingFiles() > 0 && (
              <Button
                onClick={onConvertAll}
                className="text-xs px-3 py-1 h-7"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Convert All ({getTotalPendingFiles()})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 px-4 pb-4">
          {databases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload files organized by database folders</p>
            </div>
          ) : (
            databases.map(renderDatabase)
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileTreeView;
