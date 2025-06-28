
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Edit, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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
  const [editedContent, setEditedContent] = useState(file.convertedContent || '');

  const handleSaveEdit = () => {
    onManualEdit(editedContent);
    setIsEditing(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
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
            {file.issues && file.issues.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Conversion Issues</h3>
                {file.issues.map((issue) => (
                  <Alert key={issue.id} variant={getSeverityColor(issue.severity) as any}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          {issue.severity.toUpperCase()}
                          {issue.lineNumber && <span className="text-sm">- Line {issue.lineNumber}</span>}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          {issue.description}
                          
                          {issue.originalCode && issue.suggestedFix && (
                            <div className="mt-3 p-3 bg-gray-100 rounded">
                              <p className="text-sm font-medium mb-1">Original:</p>
                              <code className="text-xs bg-red-100 px-2 py-1 rounded">
                                {issue.originalCode}
                              </code>
                              <p className="text-sm font-medium mb-1 mt-2">Suggested Fix:</p>
                              <code className="text-xs bg-green-100 px-2 py-1 rounded">
                                {issue.suggestedFix}
                              </code>
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => onFixWithAI(issue.id)}
                        className="ml-4"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Fix with AI
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">No issues found!</p>
                <p className="text-gray-500 text-sm">The conversion completed successfully.</p>
              </div>
            )}
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
                    {file.performanceMetrics.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
