
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Download, Deploy, Database, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConversionReport } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';

interface ReportViewerProps {
  report: ConversionReport;
  onBack: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onBack,
}) => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<{timestamp: string, message: string}[]>([]);
  
  const handleDownload = () => {
    // Create a blob with the report content
    const blob = new Blob([report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-migration-report-${report.timestamp.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Downloaded',
      description: 'The migration report has been downloaded to your device.',
    });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    // Add deployment start log
    const startLog = {
      timestamp: new Date().toISOString(),
      message: "Starting database deployment..."
    };
    setDeploymentLogs(prev => [...prev, startLog]);
    
    try {
      // Simulate deployment using the mock function from databaseUtils
      const result = await deployToOracle(
        { 
          type: 'oracle',
          host: 'localhost',
          port: '1521',
          username: 'system',
          password: 'password',
          database: 'ORCL'
        }, 
        report.summary
      );
      
      // Add result log
      const resultLog = {
        timestamp: new Date().toISOString(),
        message: result.success ? 
          "Database updated successfully" : 
          `Deployment error: ${result.message}`
      };
      setDeploymentLogs(prev => [...prev, resultLog]);
      
      // Show toast notification
      toast({
        title: result.success ? 'Deployment Successful' : 'Deployment Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      // Add error log
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: `Deployment error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setDeploymentLogs(prev => [...prev, errorLog]);
      
      toast({
        title: 'Deployment Failed',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Migration Report</CardTitle>
              <CardDescription>
                Generated on {new Date(report.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base font-normal px-3 py-1">
              {report.successCount + report.warningCount} of {report.filesProcessed} Successful
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Success</p>
              <p className="text-2xl font-bold">{report.successCount}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Warnings</p>
              <p className="text-2xl font-bold">{report.warningCount}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Errors</p>
              <p className="text-2xl font-bold">{report.errorCount}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Processed Files</h3>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              <div className="space-y-2">
                {report.results.map(result => (
                  <div key={result.id} className="flex justify-between items-center p-2 border-b">
                    <div className="flex items-center">
                      {result.status === 'success' ? (
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                      ) : result.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span>{result.originalFile.name}</span>
                    </div>
                    <Badge>{result.originalFile.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Full Report</h3>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[300px] p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono text-slate-800 dark:text-slate-200">
                  {report.summary}
                </pre>
              </ScrollArea>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Deployment Logs</h3>
              <Button 
                onClick={handleDeploy} 
                disabled={isDeploying}
                className="flex items-center gap-2"
              >
                <Deploy className="h-4 w-4" />
                {isDeploying ? 'Deploying...' : 'Deploy to Oracle'}
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[200px] p-4">
                {deploymentLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="h-16 w-16 mb-2 opacity-20" />
                    <p>No deployment logs yet. Click "Deploy to Oracle" to update the database.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deploymentLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 border-b border-gray-200 dark:border-gray-800">
                        <History className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm">{log.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Results
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReportViewer;
