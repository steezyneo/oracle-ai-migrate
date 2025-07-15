import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Download, Upload, Database, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConversionReport } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReportViewerProps {
  report: ConversionReport;
  onBack: () => void;
}

interface DeploymentLog {
  id: string;
  created_at: string;
  status: string;
  lines_of_sql: number;
  file_count: number;
  error_message: string | null;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onBack,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  
  // Fetch deployment logs from Supabase on component mount
  useEffect(() => {
    fetchDeploymentLogs();
    
    // Set up real-time subscription for deployment logs
    const channel = supabase
      .channel('deployment-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_logs'
        },
        () => {
          fetchDeploymentLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeploymentLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching deployment logs:', error);
        return;
      }
      setDeploymentLogs(data || []);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
    }
  };

  const saveDeploymentLog = async (status: string, linesOfSql: number, fileCount: number, errorMessage?: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .insert({
          user_id: user.id,
          status,
          lines_of_sql: linesOfSql,
          file_count: fileCount,
          error_message: errorMessage || null
        })
        .select()
        .single();
      if (error) {
        console.error('Error saving deployment log:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error saving deployment log:', error);
      return null;
    }
  };
  
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
    try {
      // Calculate lines of SQL and file count from the report
      const linesOfSql = report.summary.split('\n').length;
      const fileCount = report.filesProcessed;
      // Simulate deployment using the mock function from databaseUtils
      // We'll assume each file is deployed individually for status update
      let allSuccess = true;
      for (const result of report.results) {
        // Simulate deployment for each file (replace with real logic as needed)
        const deployResult = await deployToOracle(
          { 
            type: 'oracle',
            host: 'localhost',
            port: '1521',
            username: 'system',
            password: 'password',
            database: 'ORCL'
          },
          result.convertedCode
        );
        // Update conversion_status in migration_files for this file
        const { error: updateError } = await supabase.from('migration_files').update({
          conversion_status: deployResult.success ? 'success' : 'failed',
        }).eq('file_name', result.originalFile.name);
        
        if (updateError) {
          console.error('Error updating file status:', updateError);
        } else {
          console.log(`Updated file ${result.originalFile.name} to status: ${deployResult.success ? 'success' : 'failed'}`);
        }
        if (!deployResult.success) allSuccess = false;
      }
      // Save deployment log to Supabase
      const logEntry = await saveDeploymentLog(
        allSuccess ? 'Success' : 'Failed',
        linesOfSql,
        fileCount,
        allSuccess ? undefined : 'One or more files failed to deploy.'
      );
      toast({
        title: allSuccess ? 'Deployment Successful' : 'Deployment Failed',
        description: allSuccess ? 'All files deployed successfully.' : 'Some files failed to deploy.',
        variant: allSuccess ? 'default' : 'destructive',
      });
      if (logEntry) {
        console.log('Deployment log saved:', logEntry);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await saveDeploymentLog(
        'Failed',
        report.summary.split('\n').length,
        report.filesProcessed,
        errorMessage
      );
      toast({
        title: 'Deployment Failed',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Delete file from database
  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase.from('migration_files').delete().eq('id', fileId);
      if (error) {
        toast({ title: 'Delete Failed', description: 'Could not delete file from database.', variant: 'destructive' });
      } else {
        toast({ title: 'File Deleted', description: 'File deleted from database.' });
        // Optionally refresh the report or file list here
      }
    } catch (error) {
      toast({ title: 'Delete Failed', description: 'An error occurred while deleting the file.', variant: 'destructive' });
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
                Generated on {new Date(report.timestamp).toLocaleString()} | Report ID: {report.timestamp.split('T')[0]}-{Date.now().toString().slice(-6)}
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
                <Upload className="h-4 w-4" />
                {isDeploying ? 'Deploying...' : 'Deploy to Oracle'}
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[300px] p-4">
                {deploymentLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="h-16 w-16 mb-2 opacity-20" />
                    <p>No deployment logs yet. Click "Deploy to Oracle" to update the database.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deploymentLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                              {log.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ID: {log.id.slice(0, 8)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Files: </span>
                            <span>{log.file_count}</span>
                          </div>
                          <div>
                            <span className="font-medium">Lines of SQL: </span>
                            <span>{log.lines_of_sql}</span>
                          </div>
                        </div>
                        {log.error_message && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                            <span className="font-medium">Error: </span>
                            <span>{log.error_message}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-end">
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
