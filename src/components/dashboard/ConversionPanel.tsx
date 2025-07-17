
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  onBatchConvertFiles?: (fileIds: string[]) => Promise<void>;
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
  onBatchConvertFiles,
}) => {
  // State for selected files and batch conversion
  const [selectedFileIds, setSelectedFileIds] = React.useState<string[]>([]);
  const [isBatchConverting, setIsBatchConverting] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState<number>(0);
  const [isBatchPaused, setIsBatchPaused] = React.useState(false);
  const [isBatchCancelled, setIsBatchCancelled] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Handler for batch conversion
  const handleBatchConvert = async () => {
    setIsBatchConverting(true);
    setBatchProgress(0);
    setIsBatchPaused(false);
    setIsBatchCancelled(false);
    const ids = [...selectedFileIds];
    let processed = 0;
    for (let i = 0; i < ids.length; i += 5) {
      if (isBatchCancelled) break;
      while (isBatchPaused) {
        await new Promise(res => setTimeout(res, 500));
      }
      const batch = ids.slice(i, i + 5);
      if (onBatchConvertFiles) {
        await onBatchConvertFiles(batch);
      } else {
        await Promise.all(batch.map(async (fileId) => {
          onConvertFile(fileId);
          await new Promise(res => setTimeout(res, 100));
        }));
      }
      processed += batch.length;
      setBatchProgress(processed);
      if (i + 5 < ids.length) {
        await new Promise(res => setTimeout(res, 2000)); // 2 seconds between batches
      }
    }
    setIsBatchConverting(false);
  };

  // Handler for pause/cancel
  const handlePause = () => setIsBatchPaused(true);
  const handleResume = () => setIsBatchPaused(false);
  const handleCancel = () => {
    setIsBatchCancelled(true);
    setIsBatchConverting(false);
    setIsBatchPaused(false);
  };

  // Handler to reset migration
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

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        {/* Convert Selected Button and Progress */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            onClick={handleBatchConvert}
            disabled={isBatchConverting || selectedFileIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Convert Selected ({selectedFileIds.length})
          </Button>
          {isBatchConverting && (
            <>
              <span className="text-xs text-gray-600">{batchProgress}/{selectedFileIds.length} converted</span>
              <Button size="sm" variant="outline" onClick={isBatchPaused ? handleResume : handlePause}>
                {isBatchPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
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
          onSelectedFilesChange={setSelectedFileIds}
          onResetMigration={handleResetMigration}
        />
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

      <div className="col-span-8">
        {selectedFile ? (
          <>
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
            {files.some(f => f.conversionStatus === 'success') && (
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  onClick={onMoveToDevReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Move to Dev Review
                </Button>
                <Button 
                  onClick={onGenerateReport}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!canCompleteMigration}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Complete Migration
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a file to view
              </h3>
              <p className="text-gray-600">
                Choose a file from the list to see its details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConversionPanel;
