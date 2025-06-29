import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';

interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description: string;
}

interface ConversionIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  lineNumber?: number;
  suggestedFix?: string;
  originalCode?: string;
  category: string;
}

interface PerformanceMetrics {
  originalComplexity: number;
  convertedComplexity: number;
  improvementPercentage: number;
  recommendations: string[];
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
}

interface ConversionViewerProps {
  file: FileItem;
  onFixWithAI: (issueId: string) => void;
  onManualEdit: (newContent: string) => void;
}

const ConversionViewer: React.FC<ConversionViewerProps> = ({
  file,
  onFixWithAI,
  onManualEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isFixing, setIsFixing] = useState<string | null>(null);

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.convertedContent]);

  const handleSaveEdit = () => {
    onManualEdit(editedContent);
    setIsEditing(false);
  };

  const handleFixWithAI = async (issueId: string) => {
    setIsFixing(issueId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const issue = file.issues?.find(i => i.id === issueId);
    if (issue && issue.originalCode && issue.suggestedFix && file.convertedContent) {
      const fixedContent = file.convertedContent.replace(
        new RegExp(issue.originalCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        issue.suggestedFix
      );
      
      onManualEdit(fixedContent);
    }
    
    await onFixWithAI(issueId);
    setIsFixing(null);
  };

  const handleDismissIssue = (issueId: string) => {
    // Filter out the dismissed issue
    const updatedIssues = file.issues?.filter(issue => issue.id !== issueId) || [];
    // You might want to update the parent component state here
    console.log('Dismissed issue:', issueId);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{file.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant={
              file.conversionStatus === 'success' ? 'default' : 
              file.conversionStatus === 'failed' ? 'destructive' : 'secondary'
            }>
              {file.conversionStatus}
            </Badge>
            <Badge variant="outline">{file.type}</Badge>
            {file.convertedContent && (
              <FileDownloader
                fileName={file.name}
                content={file.convertedContent}
                fileType={file.type}
              />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="mapping">Data Types</TabsTrigger>
            <TabsTrigger value="issues">
              Issues {file.issues && file.issues.length > 0 && (
                <Badge variant="outline" className="ml-1">{file.issues.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                {file.content}
              </pre>
            </div>
            
            {file.convertedContent && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-700">Converted Oracle Code:</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-64 font-mono text-sm"
                    />
                    <Button onClick={handleSaveEdit} size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {file.convertedContent}
                  </pre>
                )}
              </div>
            )}
            
            {file.errorMessage && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-red-700">Error:</h3>
                <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                  {file.errorMessage}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mapping" className="space-y-4">
            {file.dataTypeMapping && file.dataTypeMapping.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Data Type Mappings</h3>
                {file.dataTypeMapping.map((mapping, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-red-600">Sybase</h4>
                        <code className="bg-red-50 px-2 py-1 rounded text-sm">
                          {mapping.sybaseType}
                        </code>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600">Oracle</h4>
                        <code className="bg-green-50 px-2 py-1 rounded text-sm">
                          {mapping.oracleType}
                        </code>
                      </div>
                      <div>
                        <h4 className="font-medium">Description</h4>
                        <p className="text-sm text-gray-600">{mapping.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data type mappings available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-4">
            <ConversionIssuesPanel
              issues={file.issues || []}
              onFixWithAI={handleFixWithAI}
              onDismissIssue={handleDismissIssue}
              isFixing={isFixing}
            />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            {file.performanceMetrics ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Analysis</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600">Original Complexity</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {file.performanceMetrics.originalComplexity}
                    </p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600">Converted Complexity</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {file.performanceMetrics.convertedComplexity}
                    </p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600">Improvement</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {file.performanceMetrics.improvementPercentage}%
                    </p>
                  </Card>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {file.performanceMetrics.recommendations && file.performanceMetrics.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No performance metrics available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConversionViewer;
