
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: any[];
  issues?: any[];
  performanceMetrics?: any;
}

interface ConversionPanelProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  isConverting: boolean;
  convertingFileIds: string[];
  onFileSelect: (file: FileItem) => void;
  onConvertFile: (fileId: string) => void;
  onConvertAllByType: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll: () => void;
  onFixFile: (fileId: string) => void;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
  onGenerateReport: () => void;
  onUploadRedirect: () => void;
  onClear: () => void;
  onMoveToDevReview: () => void;
  canCompleteMigration: boolean;
}

const ConversionPanel: React.FC<ConversionPanelProps> = ({
  files,
  selectedFile,
  isConverting,
  convertingFileIds,
  onFileSelect,
  onConvertFile,
  onConvertAllByType,
  onConvertAll,
  onFixFile,
  onManualEdit,
  onDismissIssue,
  onGenerateReport,
  onUploadRedirect,
  onClear,
  onMoveToDevReview,
  canCompleteMigration,
}) => {
  if (files.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Files Uploaded</CardTitle>
          <CardDescription>
            Please upload your Sybase code files first to begin the conversion process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUploadRedirect}>
            Upload Files
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compute filtered file list for navigation (should match FileTreeView's filter logic)
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
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
  // Group filtered files by type to match sidebar order
  const filteredTables = filteredFiles.filter(f => f.type === 'table');
  const filteredProcedures = filteredFiles.filter(f => f.type === 'procedure');
  const filteredTriggers = filteredFiles.filter(f => f.type === 'trigger');
  const filteredOther = filteredFiles.filter(f => f.type === 'other');
  const allFilteredFiles = [
    ...filteredTables,
    ...filteredProcedures,
    ...filteredTriggers,
    ...filteredOther
  ];
  const currentIndex = allFilteredFiles.findIndex(f => f.id === selectedFile?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFilteredFiles.length - 1;

  const [showResetDialog, setShowResetDialog] = React.useState(false);

  const handleResetMigration = () => {
    setShowResetDialog(true);
  };
  const confirmResetMigration = () => {
    setShowResetDialog(false);
    if (typeof onUploadRedirect === 'function') {
      onUploadRedirect();
    }
  };
  const cancelResetMigration = () => {
    setShowResetDialog(false);
  };

  // Progress bar calculation
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.conversionStatus === 'success' || f.conversionStatus === 'failed').length;
  const showProgress = totalFiles > 0 && completedFiles < totalFiles;
  const progressPercent = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar */}
      <div className="col-span-4">
        <Card className="h-full shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
          <CardHeader className="pb-3 flex flex-col gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 rounded-t-xl">
            <div className="flex flex-row items-center justify-between w-full mb-2">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <FileText className="h-6 w-6 text-blue-500" />
                Files to Convert
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleResetMigration} className="text-xs px-3 py-1 h-7">
                  Reset
                </Button>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-slate-800"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <FileTreeView
              files={files}
              onFileSelect={onFileSelect}
              onConvertFile={onConvertFile}
              onConvertAllByType={onConvertAllByType}
              onConvertAll={onConvertAll}
              onFixFile={onFixFile}
              selectedFile={selectedFile}
              isConverting={isConverting}
              convertingFileIds={convertingFileIds}
              hideActions={false}
              defaultExpandedSections={['tables','procedures','triggers']}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSearchTermChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onResetMigration={handleResetMigration}
            />
          </CardContent>
        </Card>
        {/* Confirmation Dialog for Reset Migration */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Migration?</DialogTitle>
            </DialogHeader>
            <div className="py-2">Are you sure you want to reset the current migration? This will clear all uploaded files and progress.</div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelResetMigration}>Cancel</Button>
              <Button variant="destructive" onClick={confirmResetMigration}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Panel */}
      <div className="col-span-8">
        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">Conversion Progress</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{completedFiles} / {totalFiles} files converted</span>
            </div>
            <Progress value={progressPercent} className="h-3 rounded-full bg-blue-100 dark:bg-blue-900/30" />
          </div>
        )}
        {selectedFile ? (
          <>
            <Card className="h-full shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 border-b border-blue-100 dark:border-slate-800">
                <span className="text-xl font-bold">{selectedFile.name}</span>
                <div className="flex items-center gap-3">
                  <span className="capitalize text-sm px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200">{selectedFile.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${selectedFile.conversionStatus === 'success' ? 'bg-green-100 text-green-700' : selectedFile.conversionStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedFile.conversionStatus}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([selectedFile.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selectedFile.name;
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
                  file={selectedFile}
                  onManualEdit={onManualEdit}
                  onDismissIssue={onDismissIssue}
                  hideEdit={true}
                  onPrevFile={hasPrev ? () => onFileSelect(allFilteredFiles[currentIndex - 1]) : undefined}
                  onNextFile={hasNext ? () => onFileSelect(allFilteredFiles[currentIndex + 1]) : undefined}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                />
              </CardContent>
            </Card>
            {files.some(f => f.conversionStatus === 'success') && (
              <div className="flex justify-end gap-4 mt-6">
                <div className="relative group">
                  <Button
                    onClick={onMoveToDevReview}
                    className="px-6 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Move to Dev Review
                  </Button>
                  <span className="absolute left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity">Send all successful files to Dev Review</span>
                </div>
                <div className="relative group">
                  <Button
                    onClick={onGenerateReport}
                    className="px-6 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                    disabled={!canCompleteMigration}
                  >
                    <Download className="h-5 w-5" />
                    Complete Migration
                  </Button>
                  <span className="absolute left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity">Generate a migration report for all successful files</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="h-full flex items-center justify-center shadow-lg rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800">
            <CardContent className="text-center">
              <FileText className="h-16 w-16 text-blue-200 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No File Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a file from the left to view its conversion details.
              </p>
              <span className="inline-block bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-full text-sm">Tip: Use the search and filter to quickly find files</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConversionPanel;
