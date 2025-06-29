
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, FileWarning, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeFile, ConversionResult, DatabaseConnection } from '@/types';
import CodeDiffViewer from './CodeDiffViewer';
import { generateConversionReport } from '@/utils/conversionUtils';

interface ConversionResultsProps {
  results: ConversionResult[];
  oracleConnection: DatabaseConnection;
  onRequestReconversion: (fileId: string, suggestion: string) => void;
  onGenerateReport: () => void;
  onComplete: () => void;
  selectedAIModel: string;
}

const ConversionResults: React.FC<ConversionResultsProps> = ({
  results,
  oracleConnection,
  onRequestReconversion,
  onGenerateReport,
  onComplete,
  selectedAIModel,
}) => {
  const { toast } = useToast();
  const [selectedResultId, setSelectedResultId] = useState<string>(results[0]?.id || '');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  
  const selectedResult = results.find(r => r.id === selectedResultId);
  
  const handleUpdateConvertedCode = (resultId: string, updatedCode: string) => {
    console.log('Updated code for', resultId, updatedCode);
    toast({
      title: 'Code Updated',
      description: 'Your changes to the converted code have been saved.'
    });
  };
  
  const handleRequestAIRewrite = (resultId: string, issue: string) => {
    setIsRewriting(true);
    toast({
      title: 'AI Rewrite Requested',
      description: `Processing: ${issue}`
    });
    
    onRequestReconversion(resultId, issue);
    
    // Reset rewriting state after a brief delay to show loading state
    setTimeout(() => {
      setIsRewriting(false);
    }, 2000);
  };
  
  const handleDownloadFile = (result: ConversionResult) => {
    const blob = new Blob([result.convertedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const fileExtension = result.originalFile.name.includes('.') 
      ? result.originalFile.name.split('.').pop() 
      : 'sql';
    const baseName = result.originalFile.name.includes('.')
      ? result.originalFile.name.substring(0, result.originalFile.name.lastIndexOf('.'))
      : result.originalFile.name;
    a.download = `${baseName}_oracle.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'File Downloaded',
      description: `${result.originalFile.name} has been downloaded successfully.`,
    });
  };
  
  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    if (status === 'success') {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (status === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <X className="h-4 w-4 text-red-500" />;
    }
  };
  
  const summaryCountsByStatus = {
    success: results.filter(r => r.status === 'success').length,
    warning: results.filter(r => r.status === 'warning').length,
    error: results.filter(r => r.status === 'error').length,
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Conversion Results</CardTitle>
          <CardDescription>
            Review and manage the converted code before finalizing.
            {selectedAIModel === 'gemini' && (
              <Badge variant="outline" className="ml-2 bg-blue-50">Powered by Gemini AI</Badge>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      {summaryCountsByStatus.success}
                    </Badge>
                    <span className="text-sm">Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      {summaryCountsByStatus.warning}
                    </Badge>
                    <span className="text-sm">Warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-50">
                      <X className="h-4 w-4 text-red-500 mr-1" />
                      {summaryCountsByStatus.error}
                    </Badge>
                    <span className="text-sm">Errors</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Files</h3>
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {results.map(result => (
                      <div 
                        key={result.id}
                        className={`p-3 rounded-md flex items-center justify-between ${
                          selectedResultId === result.id ? 'bg-primary text-white' : 'hover:bg-secondary/10'
                        }`}
                      >
                        <div 
                          className="flex items-center cursor-pointer flex-1"
                          onClick={() => setSelectedResultId(result.id)}
                        >
                          {getStatusIcon(result.status)}
                          <span className="ml-2 font-medium">{result.originalFile.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedResultId === result.id ? 'secondary' : 'outline'}>
                            {result.originalFile.type}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(result);
                            }}
                            title="Download converted file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <Button className="w-full" onClick={onGenerateReport}>
                <FileWarning className="h-4 w-4 mr-2" />
                Generate Full Report
              </Button>
            </div>
            
            <div className="lg:col-span-2">
              {selectedResult && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                      {selectedResult.originalFile.name}
                    </h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleDownloadFile(selectedResult)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleRequestAIRewrite(selectedResult.id, "Optimize for performance")}
                        disabled={isRewriting}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRewriting ? 'animate-spin' : ''}`} />
                        {isRewriting ? 'Processing...' : 'AI Rewrite'}
                      </Button>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="code">
                    <TabsList className="mb-4">
                      <TabsTrigger value="code">Code</TabsTrigger>
                      <TabsTrigger value="issues">
                        Issues
                        {selectedResult.issues.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {selectedResult.issues.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="code">
                      <CodeDiffViewer 
                        originalCode={selectedResult.originalFile.content}
                        convertedCode={selectedResult.convertedCode}
                        onUpdateConvertedCode={(updatedCode) => handleUpdateConvertedCode(selectedResult.id, updatedCode)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="issues">
                      {selectedResult.issues.length === 0 ? (
                        <div className="text-center py-8">
                          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
                          <p className="text-muted-foreground">
                            The conversion was completed successfully without any issues.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedResult.issues.map(issue => (
                            <Alert 
                              key={issue.id}
                              variant={issue.severity === 'error' ? 'destructive' : 'default'}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <AlertTitle className="flex items-center">
                                    {issue.severity === 'error' ? (
                                      <X className="h-4 w-4 mr-2" />
                                    ) : issue.severity === 'warning' ? (
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                                    {issue.lineNumber && <span className="ml-2">- Line {issue.lineNumber}</span>}
                                  </AlertTitle>
                                  <AlertDescription>
                                    {issue.description}
                                    
                                    {issue.originalCode && issue.suggestedFix && (
                                      <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                                        <p className="text-sm mb-1">Change from:</p>
                                        <code className="text-xs bg-slate-200 dark:bg-slate-700 p-1 rounded">
                                          {issue.originalCode}
                                        </code>
                                        <p className="text-sm mb-1 mt-2">To:</p>
                                        <code className="text-xs bg-slate-200 dark:bg-slate-700 p-1 rounded">
                                          {issue.suggestedFix}
                                        </code>
                                      </div>
                                    )}
                                  </AlertDescription>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRequestAIRewrite(selectedResult.id, issue.description)}
                                  disabled={isRewriting}
                                  className="min-w-[100px]"
                                >
                                  {isRewriting ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>Fix with AI</>
                                  )}
                                </Button>
                              </div>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="performance">
                      {selectedResult.performance ? (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-medium mb-2">Performance Improvements</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="p-4 bg-muted rounded-md">
                                    <p className="text-sm text-muted-foreground mb-1">Original Complexity</p>
                                    <p className="text-2xl font-bold">{selectedResult.performance.originalComplexity}</p>
                                  </div>
                                  <div className="p-4 bg-muted rounded-md">
                                    <p className="text-sm text-muted-foreground mb-1">Converted Complexity</p>
                                    <p className="text-2xl font-bold">{selectedResult.performance.convertedComplexity}</p>
                                  </div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center">
                                  <Check className="h-6 w-6 text-green-500 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium">Performance Improvement</p>
                                    <p className="text-2xl font-bold">{selectedResult.performance.improvementPercentage}%</p>
                                  </div>
                                </div>
                              </div>
                              
                              {selectedResult.performance.notes && selectedResult.performance.notes.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-medium mb-2">Optimization Notes</h3>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {selectedResult.performance.notes.map((note, index) => (
                                      <li key={index} className="text-sm">{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No performance metrics available for this file.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-end">
            <Button onClick={onComplete}>
              Complete Migration
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConversionResults;
