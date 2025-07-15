import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import CodeDiffViewer from './CodeDiffViewer';
import { diffChars } from 'diff';

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

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  aiGeneratedCode?: string; // Add this field for human edits
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
}

interface ConversionViewerProps {
  file: FileItem;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
  onSaveEdit?: (newContent: string) => void | Promise<void>; // Accepts edited content
  hideEdit?: boolean; // Hide edit option
  onPrevFile?: () => void;
  onNextFile?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const ConversionViewer: React.FC<ConversionViewerProps> = ({
  file,
  onManualEdit,
  onDismissIssue,
  onSaveEdit,
  hideEdit,
  onPrevFile,
  onNextFile,
  hasPrev,
  hasNext,
}) => {
  const { toast } = useToast();
  const { addUnreviewedFile } = useUnreviewedFiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isMarkedUnreviewed, setIsMarkedUnreviewed] = useState(false);

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.convertedContent]);

  // Helper to calculate human edit percentage (character-based)
  function getEditPercentage(aiCode: string, finalCode: string): number {
    if (!aiCode || !finalCode) return 0;
    const diff = diffChars(aiCode, finalCode);
    let changed = 0;
    let total = aiCode.length;
    diff.forEach(part => {
      if (part.added || part.removed) {
        changed += part.count || part.value.length;
      }
    });
    return total > 0 ? Math.min(100, Math.round((changed / total) * 100)) : 0;
  }
  const aiCode = (file as any).aiGeneratedCode || file.convertedContent || '';
  const finalCode = file.convertedContent || '';
  const humanEditPercent = getEditPercentage(aiCode, finalCode);

  const handleSaveEdit = async () => {
    onManualEdit(editedContent);
    setIsEditing(false);
    if (onSaveEdit) {
      await onSaveEdit(editedContent);
      return;
    }
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
            <TabsTrigger value="issues">Issues {file.issues && file.issues.length > 0 && (<Badge variant="outline" className="ml-1">{file.issues.length}</Badge>)}</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
            {file.convertedContent ? (
              <div className="grid grid-cols-2 gap-4 relative">
                {/* Left Arrow */}
                {onPrevFile && (
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onPrevFile}
                    disabled={!hasPrev}
                    style={{ left: '-2.5rem' }}
                    aria-label="Previous file"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                {/* Right Arrow */}
                {onNextFile && (
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onNextFile}
                    disabled={!hasNext}
                    style={{ right: '-2.5rem' }}
                    aria-label="Next file"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {file.content}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 text-green-700">Converted Oracle Code:</h3>
                  {/* Human Edits Metric */}
                  {isEditing ? (
                    hideEdit ? (
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                    ) : (
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
                    )
                  ) : (
                    <>
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                      {!hideEdit && (
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
                      )}
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
            {/* Human Edits Metric in Performance Tab */}
            <Card className="mb-4">
              <CardContent className="py-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 rounded px-2 py-1 mb-1">Human Edits</span>
                <span className="text-2xl font-bold text-purple-700">{humanEditPercent}%</span>
                <span className="text-xs text-muted-foreground mt-1">Percentage of AI-generated code changed by a human</span>
                <div className="mt-4 w-full">
                  <h4 className="text-sm font-medium mb-2">AI-Generated Code vs. Final Code Diff (character-based)</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                    {aiCode !== finalCode ? `AI Output:\n${aiCode}\n\nFinal Code:\n${finalCode}` : 'No changes detected.'}
                  </pre>
                </div>
              </CardContent>
            </Card>
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

                {/* Enhanced Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lines Reduced */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Lines Reduced</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {file.performanceMetrics.linesReduced || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.performanceMetrics.originalLines || 0} → {file.performanceMetrics.convertedLines || 0}
                    </p>
                  </Card>
                  
                  {/* Loops Reduced */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Loops Reduced</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {file.performanceMetrics.loopsReduced || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.performanceMetrics.originalLoops || 0} → {file.performanceMetrics.convertedLoops || 0}
                    </p>
                  </Card>
                  
                  {/* Conversion Time */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Conversion Time</h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {file.performanceMetrics.conversionTimeMs || 0}ms
                    </p>
                    <p className="text-xs text-gray-500">Processing Time</p>
                  </Card>
                </div>
                
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
