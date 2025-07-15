
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';

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

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
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
          onClear={onClear}
          hideActions={false}
          defaultExpandedSections={['tables','procedures','triggers']}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      <div className="col-span-8">
        {selectedFile ? (
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
