
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
        />
      </div>

      <div className="col-span-8">
        {selectedFile ? (
          <div className="space-y-4">
            <ConversionViewer
              file={selectedFile}
              onManualEdit={onManualEdit}
              onDismissIssue={onDismissIssue}
            />
            
            {files.some(f => f.conversionStatus === 'success') && (
              <div className="flex justify-end gap-2">
                <Button 
                  variant="primary"
                  onClick={onMoveToDevReview}
                  className="bg-blue-600 hover:bg-blue-700"
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
          </div>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a file to view conversion
              </h3>
              <p className="text-gray-600">
                Choose a file from the project structure to see its conversion details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConversionPanel;
