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

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
}

interface FileTreeViewProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onConvertFile: (fileId: string) => void;
  onConvertAllByType: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll: () => void;
  onFixFile: (fileId: string) => void;
  selectedFile: FileItem | null;
  isConverting?: boolean;
  convertingFileId?: string | null;
  selectedFileIds?: string[];
  onBulkSelect?: (ids: string[]) => void;
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
  convertingFileId = null,
  selectedFileIds = [],
  onBulkSelect
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['tables', 'procedures', 'triggers'])
  );
  const [localSelected, setLocalSelected] = useState<string[]>(selectedFileIds);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getFilesByType = (type: string) => {
    return files.filter(file => file.type === type);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed', fileId: string) => {
    if (convertingFileId === fileId) {
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

  const renderSection = (sectionKey: string, sectionTitle: string, sectionFiles: FileItem[]) => {
    const isExpanded = expandedSections.has(sectionKey);
    const pendingCount = getPendingFilesCount(sectionFiles);
    const typeKey = sectionKey === 'tables' ? 'table' : 
                   sectionKey === 'procedures' ? 'procedure' : 
                   sectionKey === 'triggers' ? 'trigger' : 'other';
    
    return (
      <div key={sectionKey} className="mb-2">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionKey)}
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
              className="text-xs px-2 py-1 h-6 ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Convert All ({pendingCount})
            </Button>
          )}
        </div>
        
        {isExpanded && (
          <div className="ml-4 space-y-1">
            <div className="flex items-center mb-1 ml-4">
              <input
                type="checkbox"
                checked={sectionFiles.every(f => localSelected.includes(f.id)) && sectionFiles.length > 0}
                onChange={e => {
                  const sectionIds = sectionFiles.map(f => f.id);
                  const newSelected = e.target.checked
                    ? Array.from(new Set([...localSelected, ...sectionIds]))
                    : localSelected.filter(id => !sectionIds.includes(id));
                  setLocalSelected(newSelected);
                  onBulkSelect && onBulkSelect(newSelected);
                }}
                className="mr-2"
              />
              <span className="text-xs">Select Section</span>
            </div>
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
                  <input
                    type="checkbox"
                    checked={localSelected.includes(file.id)}
                    onChange={e => {
                      const newSelected = e.target.checked
                        ? [...localSelected, file.id]
                        : localSelected.filter(id => id !== file.id);
                      setLocalSelected(newSelected);
                      onBulkSelect && onBulkSelect(newSelected);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="mr-2"
                  />
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className={cn(
                    "text-sm truncate",
                    file.conversionStatus === 'success' && "text-green-700",
                    file.conversionStatus === 'failed' && "text-red-700",
                    file.conversionStatus === 'pending' && "font-bold text-yellow-700",
                    file.conversionStatus === 'failed' && <span className="ml-1 text-xs text-red-500">(Error)</span>,
                    file.conversionStatus === 'pending' && <span className="ml-1 text-xs text-yellow-600">(Needs Review)</span>
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

  // Filtered files based on search and status
  const filteredFiles = files.filter(f =>
    (statusFilter === 'all' || f.conversionStatus === statusFilter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Use filteredFiles for sections
  const tables = filteredFiles.filter(f => f.type === 'table');
  const procedures = filteredFiles.filter(f => f.type === 'procedure');
  const triggers = filteredFiles.filter(f => f.type === 'trigger');
  const others = filteredFiles.filter(f => f.type === 'other');
  const totalPending = filteredFiles.filter(f => f.conversionStatus === 'pending').length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Structure</CardTitle>
          {totalPending > 0 && (
            <Button
              onClick={onConvertAll}
              className="text-xs px-3 py-1 h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Convert All ({totalPending})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 px-4 pb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border p-1 rounded text-sm flex-1"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="border p-1 rounded text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={localSelected.length === files.length && files.length > 0}
              onChange={e => {
                const allIds = files.map(f => f.id);
                setLocalSelected(e.target.checked ? allIds : []);
                onBulkSelect && onBulkSelect(e.target.checked ? allIds : []);
              }}
              className="mr-2"
            />
            <span className="font-medium">Select All</span>
          </div>
          {renderSection('tables', 'Tables', tables)}
          {renderSection('procedures', 'Procedures', procedures)}
          {renderSection('triggers', 'Triggers', triggers)}
          {others.length > 0 && renderSection('other', 'Other Files', others)}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileTreeView;
