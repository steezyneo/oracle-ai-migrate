import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';
import { supabase } from '@/integrations/supabase/client';

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
  onConvertSelected: (fileIds: string[]) => void;
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
  onConvertSelected,
  onClear,
  onMoveToDevReview,
  canCompleteMigration,
}) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    supabase.from('profiles').select('id,username,full_name,email').then(({ data }) => {
      setAllUsers(data || []);
    });
  }, []);

  const handleApproveSelected = async () => {
    await Promise.all(selectedFileIds.map(id =>
      supabase.from('migration_files').update({ review_status: 'approved' }).eq('id', id)
    ));
    setSelectedFileIds([]);
  };

  const handleAssignSelected = async () => {
    if (!assignUserId) return;
    await Promise.all(selectedFileIds.map(id =>
      supabase.from('migration_files').update({ assigned_to: assignUserId }).eq('id', id)
    ));
    setSelectedFileIds([]);
    setAssignUserId('');
  };

  const fetchFileById = useCallback(async (fileId: string) => {
    const { data, error } = await supabase.from('migration_files').select('*').eq('id', fileId).single();
    if (error) return null;
    return data;
  }, []);

  const handleFileSelect = useCallback(async (file: FileItem) => {
    const latest = await fetchFileById(file.id);
    if (latest) {
      // Update the selected file in local state
      onFileSelect({ ...file, ...latest });
      // Optionally update the files array as well
      // setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...latest } : f));
    } else {
      onFileSelect(file);
    }
  }, [fetchFileById, onFileSelect]);

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
        <div className="flex gap-2 mb-2">
          <Button size="sm" onClick={() => onConvertSelected(selectedFileIds)} disabled={selectedFileIds.length === 0}>Convert Selected</Button>
          <select
            value={assignUserId}
            onChange={e => setAssignUserId(e.target.value)}
            className="border p-1 rounded text-sm w-40"
          >
            <option value="">Assign to user...</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.username || u.email}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleAssignSelected} disabled={selectedFileIds.length === 0 || !assignUserId}>Assign Selected</Button>
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
          selectedFileIds={selectedFileIds}
          onBulkSelect={setSelectedFileIds}
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
                  Continue Migration
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
