import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, Edit3, Trash2, FileText, Folder, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { UnreviewedFile } from '@/types/unreviewedFiles';
import MarkedForReviewPanel from './MarkedForReviewPanel';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface DevReviewPanelProps {
  canCompleteMigration: boolean;
  onCompleteMigration: () => void;
  onFileReviewed: () => void; // new prop
}

const DevReviewPanel: React.FC<DevReviewPanelProps> = ({ canCompleteMigration, onCompleteMigration, onFileReviewed }) => {
  const { unreviewedFiles, isLoading, markAsReviewed, deleteUnreviewedFile, updateUnreviewedFile, refreshUnreviewedFiles } = useUnreviewedFiles();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showUnreviewed, setShowUnreviewed] = useState(true);
  const [showReviewed, setShowReviewed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Ref and state for sticky offset
  const searchCardRef = useRef<HTMLDivElement>(null);
  const [stickyOffset, setStickyOffset] = useState(0);

  useEffect(() => {
    function updateOffset() {
      if (searchCardRef.current) {
        setStickyOffset(searchCardRef.current.offsetHeight);
      }
    }
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  // Split files into pending and reviewed
  const pendingFiles = unreviewedFiles.filter(f => f.status !== 'reviewed');
  const reviewedFiles = unreviewedFiles.filter(f => f.status === 'reviewed');

  // Progress bar for review completion
  const totalFiles = unreviewedFiles.length;
  const reviewedCount = reviewedFiles.length;
  const reviewProgress = totalFiles > 0 ? Math.round((reviewedCount / totalFiles) * 100) : 0;
  const showReviewProgress = totalFiles > 0 && reviewedCount < totalFiles;

  // Filter helpers
  const filterFile = (file: UnreviewedFile) => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Pending' ? file.status !== 'reviewed' :
      statusFilter === 'Reviewed' ? file.status === 'reviewed' : true;
    return matchesSearch && matchesStatus;
  };

  const filteredPendingFiles = pendingFiles.filter(filterFile);
  const filteredReviewedFiles = reviewedFiles.filter(filterFile);

  // Map to FileItem for type property
  const mapToFileItem = (f: UnreviewedFile): any => {
    let type: 'table' | 'procedure' | 'trigger' | 'other' = 'other';
            const lower = f.file_name.toLowerCase();
            if (lower.includes('trig')) type = 'trigger';
            else if (lower.includes('proc')) type = 'procedure';
            else if (lower.includes('tab') || lower.includes('table')) type = 'table';
            return {
              ...f,
              name: f.file_name,
              content: f.original_code,
              convertedContent: f.converted_code,
              conversionStatus: 'pending',
      errorMessage: undefined,
              type,
      path: f.file_name,
      dataTypeMapping: f.data_type_mapping || [],
      issues: f.issues || [],
      performanceMetrics: f.performance_metrics || {},
    };
  };

  const mappedPendingFiles = filteredPendingFiles.map(mapToFileItem);
  const mappedReviewedFiles = filteredReviewedFiles.map(mapToFileItem);
  const filteredTables = mappedPendingFiles.filter(f => f.type === 'table');
  const filteredProcedures = mappedPendingFiles.filter(f => f.type === 'procedure');
  const filteredTriggers = mappedPendingFiles.filter(f => f.type === 'trigger');
  const filteredOther = mappedPendingFiles.filter(f => f.type === 'other');
  const reviewedTables = mappedReviewedFiles.filter(f => f.type === 'table');
  const reviewedProcedures = mappedReviewedFiles.filter(f => f.type === 'procedure');
  const reviewedTriggers = mappedReviewedFiles.filter(f => f.type === 'trigger');
  const reviewedOther = mappedReviewedFiles.filter(f => f.type === 'other');
  const allFilteredFiles = [
    ...filteredTables,
    ...filteredProcedures,
    ...filteredTriggers,
    ...filteredOther,
    ...reviewedTables,
    ...reviewedProcedures,
    ...reviewedTriggers,
    ...reviewedOther
  ];
  const currentIndex = allFilteredFiles.findIndex(f => f.id === selectedFileId);
  console.log('DEBUG: currentIndex', currentIndex, 'selectedFileId', selectedFileId, 'allFilteredFiles', allFilteredFiles.map(f => f.id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFilteredFiles.length - 1;

  // Find selected file in either list
  const selectedFile =
    pendingFiles.find(f => f.id === selectedFileId) ||
    reviewedFiles.find(f => f.id === selectedFileId) ||
    pendingFiles[0] ||
    reviewedFiles[0];

  useEffect(() => {
    if (
      allFilteredFiles.length > 0 &&
      !allFilteredFiles.some(f => f.id === selectedFileId)
    ) {
      setSelectedFileId(allFilteredFiles[0].id);
    }
  }, [allFilteredFiles, selectedFileId]);

  const handleStartEdit = (file: UnreviewedFile) => {
    setEditingFile(file.id);
    setEditedContent(file.converted_code);
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (file: UnreviewedFile, newCode: string) => {
    const success = await updateUnreviewedFile({
      id: file.id,
      converted_code: newCode
    });
    if (success) {
      setEditingFile(null);
      setEditedContent('');
    }
  };

  const handleMarkAsReviewed = async (file: UnreviewedFile) => {
    const codeToSave = editingFile === file.id ? editedContent : file.converted_code;
    const originalCode = file.original_code || '';
    const success = await markAsReviewed(file.id, file.file_name, codeToSave, originalCode);
    if (success && editingFile === file.id) {
      setEditingFile(null);
      setEditedContent('');
    }
    // After marking as reviewed, trigger parent refresh
    if (onFileReviewed) await onFileReviewed();
    setSelectedFileId(
      pendingFiles.filter(f => f.id !== file.id)[0]?.id ||
      reviewedFiles.concat([{ ...file, status: 'reviewed' }])[0]?.id ||
      null
    );
  };

  const handleDelete = async (fileId: string) => {
    await deleteUnreviewedFile(fileId);
    if (editingFile === fileId) {
      handleCancelEdit();
    }
    // After delete, select next file
    setSelectedFileId(
      pendingFiles.filter(f => f.id !== fileId)[0]?.id ||
      reviewedFiles.filter(f => f.id !== fileId)[0]?.id ||
      null
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dev Review
          </CardTitle>
          <CardDescription>
            Loading your unreviewed files...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingFiles.length === 0 && reviewedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dev Review
          </CardTitle>
          <CardDescription>
            All files have been cleared from Dev Review. Migration is complete!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Migration Complete
            </h3>
            <p className="text-sm text-muted-foreground">
              You can now view your migration report or start a new migration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-8 relative min-h-[500px] pb-20">
      {/* Sidebar */}
      <div className="flex flex-col h-full w-[340px] min-w-[280px] max-w-[380px]" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {/* Sticky Header */}
        <div className="mb-4">
          <div className="shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
            <div className="pb-2 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 rounded-t-xl px-6 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-bold text-orange-700 dark:text-orange-200">Dev Review Files</span>
              </div>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Unreviewed Files Section (no inner scroll) */}
        <Card className="mb-4 shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-orange-100 dark:border-slate-800">
          <CardHeader className="pb-2 bg-white dark:bg-slate-900 rounded-t-xl sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="font-bold text-orange-600 text-lg flex items-center gap-2">
                <Folder className="h-4 w-4 text-orange-500" />
                Unreviewed Files <Badge className="ml-1" variant="secondary">{pendingFiles.length}</Badge>
              </div>
              <button onClick={() => setShowUnreviewed(v => !v)} className="focus:outline-none">
                {showUnreviewed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            {showUnreviewed && (
              <FileTreeView
                files={mappedPendingFiles}
                onFileSelect={file => setSelectedFileId(file.id)}
                selectedFile={selectedFile ? mapToFileItem(selectedFile) : null}
                hideActions={true}
                defaultExpandedSections={[]}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchTermChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                // Remove any inner scroll or maxHeight props
              />
            )}
          </CardContent>
        </Card>
        {/* Reviewed Files Section (no inner scroll) */}
        <Card className="shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-green-100 dark:border-slate-800">
          <CardHeader className="pb-2 bg-white dark:bg-slate-900 rounded-t-xl sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-green-700 flex items-center gap-2">
                <Folder className="h-4 w-4 text-green-600" />
                Reviewed Files <Badge className="ml-1" variant="secondary">{reviewedFiles.length}</Badge>
              </div>
              <button onClick={() => setShowReviewed(v => !v)} className="focus:outline-none">
                {showReviewed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            {showReviewed && (
        <FileTreeView
                files={mappedReviewedFiles}
          onFileSelect={file => setSelectedFileId(file.id)}
                selectedFile={selectedFile ? mapToFileItem(selectedFile) : null}
                hideActions={true}
                defaultExpandedSections={[]}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchTermChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                // Remove any inner scroll or maxHeight props
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Main Panel */}
      <div className="flex-1 min-w-0">
        {/* Review Progress Bar */}
        {showReviewProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-green-700 dark:text-green-200">Review Progress</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{reviewedCount} / {totalFiles} files reviewed</span>
            </div>
            <Progress value={reviewProgress} className="h-3 rounded-full bg-green-100 dark:bg-green-900/30" />
          </div>
        )}
        {/* Main File Review Card */}
        {selectedFile ? (
          <>
            <Card className="h-full shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-green-100 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 border-b border-green-100 dark:border-green-800">
                <span className="text-xl font-bold">{selectedFile.file_name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${selectedFile.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedFile.status}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([selectedFile.original_code], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selectedFile.file_name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    title="Download original code"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ConversionViewer
                  file={mapToFileItem(selectedFile)}
                  onManualEdit={newContent => setEditedContent(newContent)}
                  onDismissIssue={() => {}}
                  hideEdit={true}
                  onPrevFile={hasPrev ? () => setSelectedFileId(allFilteredFiles[currentIndex - 1].id) : undefined}
                  onNextFile={hasNext ? () => setSelectedFileId(allFilteredFiles[currentIndex + 1].id) : undefined}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                />
                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-6">
              {selectedFile.status !== 'reviewed' && (
              <Button
                onClick={() => handleMarkAsReviewed(selectedFile)}
                    className="px-6 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
              >
                    <Check className="h-5 w-5" />
                    Mark as Reviewed
              </Button>
              )}
                <Button
                  onClick={() => handleDelete(selectedFile.id)}
                  className="px-6 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-md hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete File
                </Button>
              </div>
            </CardContent>
            </Card>
            {/* Complete Migration Button */}
            <div className="flex justify-end mt-8">
              <div className="relative group">
                <Button
                  onClick={onCompleteMigration}
                  className="px-8 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                  disabled={!canCompleteMigration}
                >
                  <Check className="h-6 w-6" />
                  Complete Migration
                </Button>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity">Finish review and generate the final migration report</span>
              </div>
            </div>
          </>
        ) : (
          <Card className="h-full flex items-center justify-center shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-green-100 dark:border-slate-800">
            <CardContent className="text-center">
              <FileText className="h-16 w-16 text-green-200 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No File Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a file from the left to review its conversion details.
              </p>
              <span className="inline-block bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 px-4 py-2 rounded-full text-sm">Tip: Use the search and filter to quickly find files</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DevReviewPanel;