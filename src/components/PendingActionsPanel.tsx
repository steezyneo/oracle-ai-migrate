import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, Edit3, Trash2, FileText } from 'lucide-react';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { UnreviewedFile } from '@/types/unreviewedFiles';
import MarkedForReviewPanel from './MarkedForReviewPanel';
import FileTreeView from '@/components/FileTreeView';
import ConversionViewer from '@/components/ConversionViewer';

interface DevReviewPanelProps {
  canCompleteMigration: boolean;
  onCompleteMigration: () => void;
}

const DevReviewPanel: React.FC<DevReviewPanelProps> = ({ canCompleteMigration, onCompleteMigration }) => {
  const { unreviewedFiles, isLoading, markAsReviewed, deleteUnreviewedFile, updateUnreviewedFile } = useUnreviewedFiles();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const selectedFile = unreviewedFiles.find(f => f.id === selectedFileId) || unreviewedFiles[0];

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
  };

  const handleDelete = async (fileId: string) => {
    await deleteUnreviewedFile(fileId);
    if (editingFile === fileId) {
      handleCancelEdit();
    }
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

  if (unreviewedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dev Review
          </CardTitle>
          <CardDescription>
            Files awaiting your review will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Files for Dev Review
            </h3>
            <p className="text-sm text-muted-foreground">
              When you move files to Dev Review, they will appear here for editing and review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 relative min-h-[500px]">
      <div className="col-span-4">
        <FileTreeView
          files={unreviewedFiles.map(f => {
            let type = 'other';
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
              errorMessage: f.error_message,
              type,
            };
          })}
          onFileSelect={file => setSelectedFileId(file.id)}
          selectedFile={{
            ...selectedFile,
            name: selectedFile?.file_name,
            content: selectedFile?.original_code,
            convertedContent: selectedFile?.converted_code,
            conversionStatus: 'pending',
            errorMessage: selectedFile?.error_message,
          }}
        />
      </div>
      <div className="col-span-8">
        {selectedFile ? (
          <div className="space-y-4">
            <ConversionViewer
              file={{
                ...selectedFile,
                name: selectedFile.file_name,
                content: selectedFile.original_code,
                convertedContent: editingFile === selectedFile.id ? editedContent : selectedFile.converted_code,
                conversionStatus: 'pending',
                errorMessage: selectedFile.error_message,
              }}
              onManualEdit={content => {
                setEditingFile(selectedFile.id);
                setEditedContent(content);
              }}
              onDismissIssue={() => {}}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartEdit(selectedFile)}
                disabled={editingFile === selectedFile.id}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={() => handleMarkAsReviewed(selectedFile)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Reviewed & Save
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(selectedFile.id)}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a file to review
              </h3>
              <p className="text-gray-600">
                Choose a file from the list to see its details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Complete Migration button always visible at bottom right */}
      <div className="absolute right-0 bottom-0 p-4">
        <Button className="bg-green-600 hover:bg-green-700" onClick={onCompleteMigration}>
          <Check className="h-4 w-4 mr-2" />
          Complete Migration
        </Button>
      </div>
    </div>
  );
};

export default DevReviewPanel;