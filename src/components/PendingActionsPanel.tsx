import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, Edit3, Trash2, FileText } from 'lucide-react';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { UnreviewedFile } from '@/types/unreviewedFiles';

const PendingActionsPanel: React.FC = () => {
  const { unreviewedFiles, isLoading, markAsReviewed, deleteUnreviewedFile, updateUnreviewedFile } = useUnreviewedFiles();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Start editing a file's converted code
  const handleStartEdit = (file: UnreviewedFile) => {
    setEditingFile(file.id);
    setEditedContent(file.converted_code);
  };

  // Cancel editing and reset state
  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditedContent('');
  };

  // Save changes to a file's converted code
  const handleSaveEdit = async (file: UnreviewedFile) => {
    const success = await updateUnreviewedFile({
      id: file.id,
      converted_code: editedContent
    });
    if (success) {
      setEditingFile(null);
      setEditedContent('');
    }
  };

  // Mark a file as reviewed and save changes
  const handleMarkAsReviewed = async (file: UnreviewedFile) => {
    const codeToSave = editingFile === file.id ? editedContent : file.converted_code;
    const originalCode = file.original_code || '';
    const success = await markAsReviewed(file.id, file.file_name, codeToSave, originalCode);
    if (success && editingFile === file.id) {
      setEditingFile(null);
      setEditedContent('');
    }
  };

  // Delete a file from the unreviewed list
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
            Pending Actions
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
            Pending Actions
          </CardTitle>
          <CardDescription>
            Files awaiting your review will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Pending Actions
            </h3>
            <p className="text-sm text-muted-foreground">
              When you mark converted files as unreviewed, they will appear here for editing and review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Actions
          <Badge variant="secondary" className="ml-2">
            {unreviewedFiles.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and edit your converted files before marking them as complete
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {unreviewedFiles.map((file) => (
              <Card key={file.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{file.file_name}</CardTitle>
                      <CardDescription className="text-xs">
                        Created: {new Date(file.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Unreviewed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Converted Code:
                    </label>
                    {editingFile === file.id ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Edit your converted code..."
                      />
                    ) : (
                      <ScrollArea className="h-[200px] w-full rounded-md border">
                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                          {file.converted_code}
                        </pre>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {editingFile === file.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(file)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsReviewed(file)}
                          className="bg-green-600 hover:bg-green-700 ml-auto"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Reviewed & Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(file)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsReviewed(file)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Reviewed & Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PendingActionsPanel;