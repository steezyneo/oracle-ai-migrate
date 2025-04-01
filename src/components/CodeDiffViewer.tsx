
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeEditor from './CodeEditor';

interface CodeDiffViewerProps {
  originalCode: string;
  convertedCode: string;
  onUpdateConvertedCode?: (updatedCode: string) => void;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  convertedCode,
  onUpdateConvertedCode,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Code Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="split">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="original">Original (Sybase)</TabsTrigger>
            <TabsTrigger value="converted">Converted (Oracle)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="split">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Original (Sybase)</h3>
                <CodeEditor 
                  initialCode={originalCode} 
                  readOnly={true} 
                  height="350px"
                  language="sql"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Converted (Oracle)</h3>
                <CodeEditor 
                  initialCode={convertedCode} 
                  readOnly={false} 
                  onSave={onUpdateConvertedCode}
                  height="350px"
                  language="plsql"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="original">
            <h3 className="text-sm font-medium mb-2">Original (Sybase)</h3>
            <CodeEditor 
              initialCode={originalCode} 
              readOnly={true} 
              height="500px"
              language="sql"
            />
          </TabsContent>
          
          <TabsContent value="converted">
            <h3 className="text-sm font-medium mb-2">Converted (Oracle)</h3>
            <CodeEditor 
              initialCode={convertedCode} 
              readOnly={false} 
              onSave={onUpdateConvertedCode}
              height="500px"
              language="plsql"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodeDiffViewer;
