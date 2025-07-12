
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CodeEditor from './CodeEditor';

interface CodeDiffViewerProps {
  originalCode: string;
  convertedCode: string;
  onUpdateConvertedCode?: (updatedCode: string) => void;
  readOnly?: boolean;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  convertedCode,
  onUpdateConvertedCode,
  readOnly = false,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Code Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Original (Sybase)</h3>
            <CodeEditor 
              initialCode={originalCode} 
              readOnly={true} 
              height="500px"
              language="sql"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Converted (Oracle)</h3>
            <CodeEditor 
              initialCode={convertedCode} 
              readOnly={readOnly} 
              onSave={onUpdateConvertedCode}
              height="500px"
              language="plsql"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeDiffViewer;
