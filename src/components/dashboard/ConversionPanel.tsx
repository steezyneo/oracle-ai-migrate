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
  convertingFileId: string | null;
  onFileSelect: (file: FileItem) => void;
  onConvertFile: (fileId: string) => void;
  onConvertAllByType: (type: 'table' | 'procedure' | 'trigger' | 'other') => void;
  onConvertAll: () => void;
  onFixFile: (fileId: string) => void;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
  onGenerateReport: () => void;
  onUploadRedirect: () => void;
}

const ConversionPanel: React.FC<ConversionPanelProps> = ({
  files,
  selectedFile,
  isConverting,
  convertingFileId,
  onFileSelect,
  onConvertFile,
  onConvertAllByType,
  onConvertAll,
  onFixFile,
  onManualEdit,
  onDismissIssue,
  onGenerateReport,
  onUploadRedirect,
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

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        <div className="flex gap-2 mb-2">
          <Button size="sm" onClick={() => selectedFileIds.forEach(id => onConvertFile(id))} disabled={selectedFileIds.length === 0}>Convert Selected</Button>
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
          convertingFileId={convertingFileId}
          selectedFileIds={selectedFileIds}
          onBulkSelect={setSelectedFileIds}
        />
      </div>

      <div className="col-span-8">
        {selectedFile ? (
          <div className="space-y-4">
            <ConversionViewer
              file={selectedFile}
              onManualEdit={onManualEdit}
              onDismissIssue={onDismissIssue}
              fileList={files}
              onNavigateFile={fileId => {
                const nextFile = files.find(f => f.id === fileId);
                if (nextFile) handleFileSelect(nextFile);
              }}
              onCommentAdded={async (fileId) => {
                // After adding a comment, fetch the latest file data
                const latest = await fetchFileById(fileId);
                if (latest) {
                  onFileSelect({ ...selectedFile, ...latest });
                  // Optionally update the files array as well
                  // setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...latest } : f));
                }
              }}
            />
            
            {files.some(f => f.conversionStatus === 'success') && (
              <div className="flex justify-end">
                <Button 
                  onClick={onGenerateReport}
                  className="bg-green-600 hover:bg-green-700"
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
