import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkedForReviewPanelProps {
  originalCode: string;
  convertedCode: string;
  onSave: (newCode: string) => void;
}

const MarkedForReviewPanel: React.FC<MarkedForReviewPanelProps> = ({
  originalCode,
  convertedCode,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(convertedCode);

  useEffect(() => {
    setEditedCode(convertedCode);
  }, [convertedCode]);

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => {
    setIsEditing(false);
    onSave(editedCode);
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditedCode(convertedCode);
  };

  return (
    <Card className="w-full">
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
              {originalCode}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-green-700">Converted Oracle Code:</h3>
            {isEditing ? (
              <>
                <Textarea
                  value={editedCode}
                  onChange={e => setEditedCode(e.target.value)}
                  className="min-h-64 font-mono text-sm mb-2"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="default" onClick={handleSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {convertedCode}
                </pre>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    Edit
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarkedForReviewPanel; 