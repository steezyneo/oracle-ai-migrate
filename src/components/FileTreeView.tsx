import React, { useState, useRef, useEffect } from 'react';
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
  onConvertFile?: (fileId: string) => void;
  onConvertAllByType?: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll?: () => void;
  onFixFile?: (fileId: string) => void;
  selectedFile: FileItem | null;
  isConverting?: boolean;
  convertingFileIds?: string[];
  // onClear?: () => void; // Remove this prop
  hideActions?: boolean;
  defaultExpandedSections?: string[];
  searchTerm?: string;
  statusFilter?: string;
  onSearchTermChange?: (term: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onSelectedFilesChange?: (selected: string[]) => void;
  onResetMigration?: () => void; // Add this prop
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
  // onClear, // Remove this prop
  hideActions = false,
  defaultExpandedSections = [],
  searchTerm = '',
  statusFilter = 'All',
  onSearchTermChange,
  onStatusFilterChange,
  onSelectedFilesChange,
  onResetMigration, // Add this prop
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(defaultExpandedSections)
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Notify parent when selected files change
  React.useEffect(() => {
    if (typeof onSelectedFilesChange === 'function') {
      onSelectedFilesChange(selectedFiles);
    }
  }, [selectedFiles, onSelectedFilesChange]);

  const isFileSelected = (fileId: string) => selectedFiles.includes(fileId);
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };
  const selectAllInSection = (sectionFiles: FileItem[]) => {
    const sectionIds = sectionFiles.map(f => f.id);
    const allSelected = sectionIds.every(id => selectedFiles.includes(id));
    setSelectedFiles(prev =>
      allSelected ? prev.filter(id => !sectionIds.includes(id)) : Array.from(new Set([...prev, ...sectionIds]))
    );
  };
  const selectAllFiles = () => {
    const allIds = filteredFiles.map(f => f.id);
    const allSelected = allIds.every(id => selectedFiles.includes(id));
    setSelectedFiles(allSelected ? [] : allIds);
  };

  // Filter files by search and status
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Pending' ? file.conversionStatus === 'pending' :
      statusFilter === 'Success' ? file.conversionStatus === 'success' :
      statusFilter === 'Failed' ? file.conversionStatus === 'failed' :
      statusFilter === 'Reviewed' ? file.conversionStatus === 'reviewed' : true;
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

  const getStatusIcon = (status: 'pending' | 'success' | 'failed', fileId: string) => {
    if (isConverting && convertingFileIds && convertingFileIds.includes(fileId)) {
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
    if (status === 'success') {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    if (status === 'failed') {
      return <X className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  // Refs for indeterminate checkboxes
  const allFilesCheckboxRef = useRef<HTMLInputElement>(null);
  const sectionCheckboxRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Set indeterminate state for all files checkbox
  useEffect(() => {
    if (allFilesCheckboxRef.current) {
      const allChecked = filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.includes(f.id));
      const someChecked = filteredFiles.some(f => selectedFiles.includes(f.id));
      allFilesCheckboxRef.current.indeterminate = someChecked && !allChecked;
    }
    // Set indeterminate for each section
    ['tables', 'procedures', 'triggers', 'other'].forEach(sectionKey => {
      const sectionFiles = getFilesByType(
        sectionKey === 'tables' ? 'table' :
        sectionKey === 'procedures' ? 'procedure' :
        sectionKey === 'triggers' ? 'trigger' : 'other'
      );
      const ref = sectionCheckboxRefs.current[sectionKey];
      if (ref) {
        const allChecked = sectionFiles.length > 0 && sectionFiles.every(f => selectedFiles.includes(f.id));
        const someChecked = sectionFiles.some(f => selectedFiles.includes(f.id));
        ref.indeterminate = someChecked && !allChecked;
      }
    });
  }, [selectedFiles, filteredFiles]);

  const renderSection = (sectionKey: string, sectionTitle: string, sectionFiles: FileItem[]) => {
    const isExpanded = expandedSections.has(sectionKey);
    const pendingCount = sectionFiles.filter(f => f.conversionStatus === 'pending').length;
    const typeKey = sectionKey === 'tables' ? 'table' : 
                   sectionKey === 'procedures' ? 'procedure' : 
                   sectionKey === 'triggers' ? 'trigger' : 'other';
    return (
      <div key={sectionKey} className="mb-2">
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              ref={el => { sectionCheckboxRefs.current[sectionKey] = el; }}
              checked={sectionFiles.length > 0 && sectionFiles.every(f => selectedFiles.includes(f.id))}
              onChange={() => selectAllInSection(sectionFiles)}
              className="mr-2"
              aria-label={`Select all ${sectionTitle}`}
            />
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
          </div>
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
                    checked={isFileSelected(file.id)}
                    onChange={e => {
                      e.stopPropagation();
                      toggleFileSelection(file.id);
                    }}
                    className="mr-2"
                    aria-label={`Select ${file.name}`}
                  />
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className={cn(
                    "text-sm truncate",
                    file.conversionStatus === 'success' && "text-green-700",
                    file.conversionStatus === 'failed' && "text-red-700"
                  )}>
                    {file.name}
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

  const tables = getFilesByType('table');
  const procedures = getFilesByType('procedure');
  const triggers = getFilesByType('trigger');
  const others = getFilesByType('other');
  const totalPending = files.filter(f => f.conversionStatus === 'pending').length;

  return (
    <Card className="h-full">
      {!hideActions && (
        <CardHeader className="pb-3 flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between w-full mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                ref={allFilesCheckboxRef}
                checked={filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.includes(f.id))}
                onChange={selectAllFiles}
                className="mr-2"
                aria-label="Select all files"
              />
              <CardTitle className="text-lg">Project Structure</CardTitle>
            </div>
            <div className="flex gap-2">
              {/* Remove Clear button, add Reset Migration button */}
              {onResetMigration && (
                <Button variant="destructive" onClick={onResetMigration} className="text-xs px-3 py-1 h-7">
                  Reset Migration
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
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
          {/* Select All Button */}
          <div className="flex flex-row items-center gap-2 mb-2">
            <Button
              variant={filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.includes(f.id)) ? 'default' : 'outline'}
              size="sm"
              onClick={selectAllFiles}
              className="text-xs px-3 py-1 h-7"
            >
              {filteredFiles.length > 0 && filteredFiles.every(f => selectedFiles.includes(f.id)) ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-xs text-gray-500">({selectedFiles.length} selected)</span>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="space-y-1 px-4 pb-4">
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
