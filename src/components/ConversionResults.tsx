
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, AlertTriangle, X, FileWarning, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeFile, ConversionResult, DatabaseConnection } from '@/types';
import CodeDiffViewer from './CodeDiffViewer';
import ConversionIssuesPanel from './ConversionIssuesPanel';
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
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  
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

  const handleFixWithAI = async (issueId: string) => {
    if (!selectedResult) return;
    
    setFixingIssueId(issueId);
    
    try {
      // Find the specific issue
      const issue = selectedResult.issues.find(i => i.id === issueId);
      if (issue) {
        await handleRequestAIRewrite(selectedResult.id, issue.description);
      }
    } catch (error) {
      console.error('Error fixing issue:', error);
      toast({
        title: 'Fix Failed',
        description: 'Failed to apply the fix. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFixingIssueId(null);
    }
  };

  const handleDismissIssue = (issueId: string) => {
    // In a real implementation, you would update the results to remove this issue
    toast({
      title: 'Issue Dismissed',
      description: 'The issue has been marked as resolved.',
    });
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

  // Generate sample data type mapping and syntax differences for demonstration
  const generateSampleDataTypeMapping = () => {
    const mappings = [
      { tsql: 'varchar', plsql: 'VARCHAR2', usage: 'String data', notes: 'VARCHAR2 is preferred in Oracle' },
      { tsql: 'int', plsql: 'NUMBER(10)', usage: 'Integer values', notes: 'Oracle uses NUMBER for integers' },
      { tsql: 'datetime', plsql: 'DATE', usage: 'Date and time', notes: 'Oracle DATE includes time component' },
      { tsql: 'text', plsql: 'CLOB', usage: 'Large text data', notes: 'CLOB for large character data' },
      { tsql: 'bit', plsql: 'NUMBER(1)', usage: 'Boolean values', notes: 'Oracle uses NUMBER(1) for boolean' },
    ];
    return mappings;
  };

  const generateSampleSyntaxDifferences = () => {
    const differences = [
      { category: 'Variables', tsql: 'DECLARE @var INT', plsql: 'DECLARE var NUMBER;', example: '@count vs count' },
      { category: 'IF Statement', tsql: 'IF @condition = 1', plsql: 'IF condition = 1 THEN', example: 'IF-THEN-END IF structure' },
      { category: 'String Concat', tsql: "'Hello' + @name", plsql: "'Hello' || name", example: '+ vs ||' },
      { category: 'Print', tsql: 'PRINT @message', plsql: 'DBMS_OUTPUT.PUT_LINE(message)', example: 'Output statements' },
      { category: 'Error Handling', tsql: 'TRY...CATCH', plsql: 'EXCEPTION WHEN...THEN', example: 'Exception handling' },
    ];
    return differences;
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
                        className={`p-3 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                          selectedResultId === result.id ? 'bg-primary text-white' : 'hover:bg-secondary/10'
                        }`}
                        onClick={() => setSelectedResultId(result.id)}
                      >
                        <div className="flex items-center flex-1">
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
                      <TabsTrigger value="mapping">Data Type Mapping</TabsTrigger>
                      <TabsTrigger value="syntax">Syntax Differences</TabsTrigger>
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

                    <TabsContent value="mapping">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>T-SQL (Sybase)</TableHead>
                            <TableHead>PL/SQL (Oracle)</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generateSampleDataTypeMapping().map((mapping, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{mapping.tsql}</TableCell>
                              <TableCell className="font-mono">{mapping.plsql}</TableCell>
                              <TableCell>{mapping.usage}</TableCell>
                              <TableCell>{mapping.notes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="syntax">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>T-SQL Syntax</TableHead>
                            <TableHead>PL/SQL Syntax</TableHead>
                            <TableHead>Example</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generateSampleSyntaxDifferences().map((diff, index) => (
                            <TableRow key={index}>
                              <TableCell>{diff.category}</TableCell>
                              <TableCell className="font-mono">{diff.tsql}</TableCell>
                              <TableCell className="font-mono">{diff.plsql}</TableCell>
                              <TableCell className="font-mono">{diff.example}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="issues">
                      <ConversionIssuesPanel
                        issues={selectedResult.issues}
                        onFixWithAI={handleFixWithAI}
                        onDismissIssue={handleDismissIssue}
                        isFixing={fixingIssueId}
                      />
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
