
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, FileWarning, ArrowRight, Send, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeFile, ConversionResult, DatabaseConnection } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';
import CodeDiffViewer from './CodeDiffViewer';
import { generateConversionReport } from '@/utils/conversionUtils';

interface ConversionResultsProps {
  results: ConversionResult[];
  oracleConnection: DatabaseConnection;
  onRequestReconversion: (fileId: string, suggestion: string) => void;
  onGenerateReport: () => void;
  onComplete: () => void;
}

const ConversionResults: React.FC<ConversionResultsProps> = ({
  results,
  oracleConnection,
  onRequestReconversion,
  onGenerateReport,
  onComplete,
}) => {
  const { toast } = useToast();
  const [selectedResultId, setSelectedResultId] = useState<string>(results[0]?.id || '');
  const [deploymentStatus, setDeploymentStatus] = useState<{[key: string]: 'pending' | 'deploying' | 'success' | 'error'}>({});
  
  const selectedResult = results.find(r => r.id === selectedResultId);
  
  const handleDeploy = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    
    setDeploymentStatus(prev => ({ ...prev, [resultId]: 'deploying' }));
    
    try {
      const deployResult = await deployToOracle(oracleConnection, result.convertedCode);
      
      if (deployResult.success) {
        setDeploymentStatus(prev => ({ ...prev, [resultId]: 'success' }));
        toast({
          title: 'Deployment Successful',
          description: `${result.originalFile.name} has been deployed to Oracle successfully.`,
        });
      } else {
        setDeploymentStatus(prev => ({ ...prev, [resultId]: 'error' }));
        toast({
          title: 'Deployment Failed',
          description: deployResult.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setDeploymentStatus(prev => ({ ...prev, [resultId]: 'error' }));
      toast({
        title: 'Deployment Error',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateConvertedCode = (resultId: string, updatedCode: string) => {
    console.log('Updated code for', resultId, updatedCode);
    // In a real app, this would update the code in the state
    // For this demo, we'll just show a toast
    toast({
      title: 'Code Updated',
      description: 'Your changes to the converted code have been saved.'
    });
  };
  
  const handleRequestAIRewrite = (resultId: string, issue: string) => {
    onRequestReconversion(resultId, issue);
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
  
  const getDeploymentStatusButton = (resultId: string) => {
    const status = deploymentStatus[resultId];
    
    if (status === 'deploying') {
      return (
        <Button disabled>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Deploying...
        </Button>
      );
    } else if (status === 'success') {
      return (
        <Button variant="ghost" disabled>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Deployed
        </Button>
      );
    } else if (status === 'error') {
      return (
        <Button variant="outline" onClick={() => handleDeploy(resultId)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      );
    } else {
      return (
        <Button onClick={() => handleDeploy(resultId)}>
          <ArrowRight className="h-4 w-4 mr-2" />
          Deploy
        </Button>
      );
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
            Review and manage the converted code before deployment.
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
                        className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                          selectedResultId === result.id ? 'bg-primary text-white' : 'hover:bg-secondary/10'
                        }`}
                        onClick={() => setSelectedResultId(result.id)}
                      >
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className="ml-2 font-medium">{result.originalFile.name}</span>
                        </div>
                        <Badge variant={selectedResultId === result.id ? 'secondary' : 'outline'}>
                          {result.originalFile.type}
                        </Badge>
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
                      {getDeploymentStatusButton(selectedResult.id)}
                      <Button variant="outline" onClick={() => handleRequestAIRewrite(selectedResult.id, "Optimize for performance")}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        AI Rewrite
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
                              variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'default' : 'outline'}
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
                                >
                                  Fix with AI
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
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={onGenerateReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={onComplete}>
              <Send className="h-4 w-4 mr-2" />
              Complete Migration
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConversionResults;
