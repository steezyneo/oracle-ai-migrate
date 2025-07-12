import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Clock } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import CodeDiffViewer from './CodeDiffViewer';
import { FileItem } from '@/types';

interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description: string;
}


interface PerformanceMetrics {
  originalComplexity: number;
  convertedComplexity: number;
  improvementPercentage: number;
  recommendations: string[];
  performanceScore?: number;
  codeQuality?: {
    totalLines: number;
    codeLines: number;
    commentRatio: number;
    complexityLevel: 'Low' | 'Medium' | 'High';
  };
  maintainabilityIndex?: number;
  conversionTimeMs?: number;
}


interface ConversionViewerProps {
  file: FileItem;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
}

const ConversionViewer: React.FC<ConversionViewerProps> = ({
  file,
  onManualEdit,
  onDismissIssue,
}) => {
  const { toast } = useToast();
  const { addUnreviewedFile } = useUnreviewedFiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isMarkedUnreviewed, setIsMarkedUnreviewed] = useState(false);

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.convertedContent]);

  const handleSaveEdit = async () => {
    onManualEdit(editedContent);
    setIsEditing(false);
    // Persist to Supabase
    if (file.id) {
      const { error } = await supabase
        .from('migration_files')
        .update({ converted_content: editedContent })
        .eq('id', file.id);
      if (error) {
        toast({
          title: 'Save Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Saved',
          description: 'Changes saved to database.'
        });
      }
    }
  };

  const handleMarkAsUnreviewed = async () => {
    if (!file.convertedContent) {
      toast({
        title: "No Converted Code",
        description: "This file doesn't have converted code to mark as unreviewed.",
        variant: "destructive"
      });
      return;
    }

    const success = await addUnreviewedFile({
      user_id: '', // This will be set by the hook
      file_name: file.name,
      converted_code: file.convertedContent,
      original_code: file.content,
    });

    if (success) {
      toast({
        title: "File Marked as Unreviewed",
        description: `${file.name} has been added to your pending actions for review.`,
      });
      setIsMarkedUnreviewed(true);
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
            {file.convertedContent && (
              <>
                <FileDownloader
                  fileName={file.name}
                  content={file.convertedContent}
                  fileType={file.type}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsUnreviewed}
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Mark as Unreviewed
                </Button>
              </>
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
            {file.convertedContent ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {file.content}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 text-green-700">Converted Oracle Code:</h3>
                  {isEditing ? (
                    <>
                      <Textarea
                        value={editedContent}
                        onChange={e => setEditedContent(e.target.value)}
                        className="min-h-64 font-mono text-sm mb-2"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleSaveEdit}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {file.content}
                </pre>
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
                <div className="grid gap-3">
                  {file.dataTypeMapping.map((mapping, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-red-600 mb-2">Sybase Type</h4>
                          <code className="bg-red-50 px-3 py-2 rounded text-sm font-mono block">
                            {mapping.sybaseType}
                          </code>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Oracle Type</h4>
                          <code className="bg-green-50 px-3 py-2 rounded text-sm font-mono block">
                            {mapping.oracleType}
                          </code>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                            {mapping.description || 'Standard type conversion'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
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
              onDismissIssue={onDismissIssue}
            />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            {file.performanceMetrics ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Quantitative Performance Analysis</h3>
                
                {/* Performance Score */}
                <Card className="p-6">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Overall Performance Score</h4>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {file.performanceMetrics.performanceScore || 0}/100
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.performanceMetrics.performanceScore || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>

                {/* Complexity Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Original Complexity</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {file.performanceMetrics.originalComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500">Cyclomatic Complexity</p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Converted Complexity</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {file.performanceMetrics.convertedComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500">Cyclomatic Complexity</p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Improvement</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {file.performanceMetrics.improvementPercentage || 0}%
                    </p>
                    <p className="text-xs text-gray-500">Performance Gain</p>
                  </Card>
                </div>

                {/* Code Quality Metrics */}
                {file.performanceMetrics.codeQuality && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Code Quality Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{file.performanceMetrics.codeQuality.totalLines}</p>
                        <p className="text-sm text-gray-600">Total Lines</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{file.performanceMetrics.codeQuality.codeLines}</p>
                        <p className="text-sm text-gray-600">Code Lines</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{file.performanceMetrics.codeQuality.commentRatio}%</p>
                        <p className="text-sm text-gray-600">Comment Ratio</p>
                      </div>
                      <div className="text-center">
                        <Badge variant={
                          file.performanceMetrics.codeQuality.complexityLevel === 'Low' ? 'default' :
                          file.performanceMetrics.codeQuality.complexityLevel === 'Medium' ? 'secondary' : 'destructive'
                        }>
                          {file.performanceMetrics.codeQuality.complexityLevel}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">Complexity</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Maintainability Index */}
                {file.performanceMetrics.maintainabilityIndex && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Maintainability Index</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {file.performanceMetrics.maintainabilityIndex}/100
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${file.performanceMetrics.maintainabilityIndex}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {file.performanceMetrics.maintainabilityIndex >= 80 ? 'Excellent' :
                         file.performanceMetrics.maintainabilityIndex >= 60 ? 'Good' :
                         file.performanceMetrics.maintainabilityIndex >= 40 ? 'Fair' : 'Poor'} Maintainability
                      </p>
                    </div>
                  </Card>
                )}

                {/* Conversion Time */}
                {file.performanceMetrics.conversionTimeMs && (
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Conversion Time</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {file.performanceMetrics.conversionTimeMs}ms
                      </p>
                    </div>
                  </Card>
                )}
                
                {/* Recommendations */}
                {file.performanceMetrics.recommendations && file.performanceMetrics.recommendations.length > 0 && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Performance Recommendations</h4>
                    <ul className="space-y-3">
                      {file.performanceMetrics.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
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
