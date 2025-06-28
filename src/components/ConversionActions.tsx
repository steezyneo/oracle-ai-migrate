
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ConversionActionsProps {
  hasConvertedFiles: boolean;
  onCompleteMigration: () => void;
}

const ConversionActions: React.FC<ConversionActionsProps> = ({
  hasConvertedFiles,
  onCompleteMigration
}) => {
  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">
              Ready to complete migration
            </span>
          </div>
          <Button 
            onClick={onCompleteMigration}
            disabled={!hasConvertedFiles}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Migration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionActions;
