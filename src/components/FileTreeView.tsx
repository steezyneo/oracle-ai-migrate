import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed' | 'pending_review';
  convertedContent?: string;
  errorMessage?: string;
}

interface FileTreeViewProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onConvertFile?: (fileId: string) => void;
  onConvertAllByType?: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll?: () => void;
  onFixFile?: (fileId: string) => void;
  selectedFile: FileItem | null;
  isConverting?: boolean;
  convertingFileIds?: string[];
  selectedFileIds?: string[];
  onBulkSelect?: (ids: string[]) => void;
  onClear?: () => void;
  hideActions?: boolean;
  defaultExpandedSections?: string[];
  searchTerm?: string;
  statusFilter?: string;
  onSearchTermChange?: (term: string) => void;
  onStatusFilterChange?: (status: string) => void;
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
  selectedFileIds = [],
  onBulkSelect,
  onClear,
  hideActions = false,
  defaultExpandedSections = [],
  searchTerm = '',
  statusFilter = 'All',
  onSearchTermChange,
  onStatusFilterChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(defaultExpandedSections)
  );
  const [localSelected, setLocalSelected] = useState<string[]>(selectedFileIds);

  // Filter files by search and status
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Pending' ? file.conversionStatus === 'pending' :
      statusFilter === 'Success' ? file.conversionStatus === 'success' :
      statusFilter === 'Failed' ? file.conversionStatus === 'failed' :
      statusFilter === 'Pending Review' ? file.conversionStatus === 'pending_review' : true;
    return matchesSearch && matchesStatus;
  });

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
    return filteredFiles.filter(file => file.type === type);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed' | 'pending_review', fileId: string) => {
    if (isConverting && convertingFileIds.includes(fileId)) {
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
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

  const renderSection = (sectionKey: string, sectionTitle: string, sectionFiles: FileItem[]) => {
    const isExpanded = expandedSections.has(sectionKey);
    const pendingCount = sectionFiles.filter(f => f.conversionStatus === 'pending').length;
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
          {!hideActions && pendingCount > 0 && onConvertAllByType && (
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
                    file.conversionStatus === 'pending_review' && "font-bold text-yellow-600"
                  )}>
                    {file.name}
                    {file.conversionStatus === 'failed' && <span className="ml-1 text-xs text-red-500">(Error)</span>}
                    {file.conversionStatus === 'pending_review' && <span className="ml-1 text-xs text-yellow-600">(Marked for Review)</span>}
                  </span>
                </div>
                {!hideActions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onConvertFile && getStatusIcon(file.conversionStatus, file.id)}
                    {file.conversionStatus === 'pending' && onConvertFile && (
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
                    {file.conversionStatus === 'failed' && onFixFile && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filtered files based on search and status
  const tables = filteredFiles.filter(f => f.type === 'table');
  const procedures = filteredFiles.filter(f => f.type === 'procedure');
  const triggers = filteredFiles.filter(f => f.type === 'trigger');
  const others = filteredFiles.filter(f => f.type === 'other');
  const totalPending = filteredFiles.filter(f => f.conversionStatus === 'pending').length;

  return (
    <Card className="h-full">
      {!hideActions && (
        <CardHeader className="pb-3 flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between w-full mb-2">
            <CardTitle className="text-lg">Project Structure</CardTitle>
            <div className="flex gap-2">
              {onClear && files.length > 0 && (
                <Button variant="destructive" onClick={onClear} className="text-xs px-3 py-1 h-7">
                  Clear
                </Button>
              )}
              {onConvertAll && totalPending > 0 && (
                <Button
                  onClick={onConvertAll}
                  className="text-xs px-3 py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Convert All ({totalPending})
                </Button>
              )}
            </div>
          </div>
          {/* Search and Filter Row */}
          <div className="flex flex-row gap-2 w-full mb-2">
            <Input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={e => onSearchTermChange ? onSearchTermChange(e.target.value) : undefined}
              className="flex-1 h-8 text-sm"
            />
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange ? onStatusFilterChange(e.target.value) : undefined}
              className="h-8 text-sm border rounded px-2"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="space-y-1 px-4 pb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={e => onSearchTermChange ? onSearchTermChange(e.target.value) : undefined}
              className="border p-1 rounded text-sm flex-1"
            />
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange ? onStatusFilterChange(e.target.value) : undefined}
              className="border p-1 rounded text-sm"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Pending Review">Pending Review</option>
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
