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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';


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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['tables', 'procedures', 'triggers'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getFilesByDatabase = () => {
    const databases = new Map<string, FileItem[]>();
    files.forEach(file => {
      if (!databases.has(file.database)) {
        databases.set(file.database, []);
      }
      databases.get(file.database)!.push(file);
    });
    return databases;
  };

  const getFilesByDatabaseAndType = (database: string, type: string) => {
    return files.filter(file => file.database === database && file.type === type);
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

  const renderTypeSection = (database: string, sectionKey: string, sectionTitle: string, sectionFiles: FileItem[]) => {
    const sectionId = `${database}-${sectionKey}`;
    const isExpanded = expandedSections.has(sectionId);
    const pendingCount = getPendingFilesCount(sectionFiles);
    const typeKey = sectionKey === 'tables' ? 'table' : 
                   sectionKey === 'procedures' ? 'procedure' : 
                   sectionKey === 'triggers' ? 'trigger' : 'other';
    
    if (sectionFiles.length === 0) return null;
    
    return (
      <div key={sectionId} className="mb-1">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionId)}
            className="flex-1 justify-start p-0 h-auto font-medium text-sm"
          >
            {isExpanded ? 
              <ChevronDown className="h-3 w-3 mr-2" /> : 
              <ChevronRight className="h-3 w-3 mr-2" />
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
          <div className="ml-6 space-y-1">
            {sectionFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer group",
                  selectedFile?.id === file.id && "bg-blue-50 border border-blue-200"
                )}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-3 w-3 text-gray-500 flex-shrink-0" />
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
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDatabaseSection = (database: string, databaseFiles: FileItem[]) => {
    const isExpanded = expandedSections.has(database);
    const tables = databaseFiles.filter(f => f.type === 'table');
    const procedures = databaseFiles.filter(f => f.type === 'procedure');
    const triggers = databaseFiles.filter(f => f.type === 'trigger');
    const others = databaseFiles.filter(f => f.type === 'other');
    
    return (
      <div key={database} className="mb-3">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded bg-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(database)}
            className="flex-1 justify-start p-0 h-auto font-semibold"
          >
            {isExpanded ? 
              <FolderOpen className="h-4 w-4 mr-2 text-blue-600" /> : 
              <Folder className="h-4 w-4 mr-2 text-blue-600" />
            }
            <Database className="h-4 w-4 mr-2 text-blue-600" />
            <span className="ml-1">{database} ({databaseFiles.length} files)</span>
          </Button>
        </div>
        
        {isExpanded && (
          <div className="ml-2 space-y-1 mt-2">
            {renderTypeSection(database, 'tables', 'Tables', tables)}
            {renderTypeSection(database, 'procedures', 'Procedures', procedures)}
            {renderTypeSection(database, 'triggers', 'Triggers', triggers)}
            {others.length > 0 && renderTypeSection(database, 'other', 'Other Files', others)}
          </div>
        )}
      </div>
    );
  };

  const databaseFiles = getFilesByDatabase();
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
        <div className="space-y-2 px-4 pb-4">
          {Array.from(databaseFiles.entries()).map(([database, dbFiles]) => 
            renderDatabaseSection(database, dbFiles)
          )}
          {files.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No database files uploaded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileTreeView;
