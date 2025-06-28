
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MigrationReportProps {
  report: any;
  onBack: () => void;
}

interface DeploymentLog {
  id: string;
  status: string;
  file_count: number;
  lines_of_sql: number;
  created_at: string;
  error_message?: string;
}

const MigrationReport: React.FC<MigrationReportProps> = ({ report, onBack }) => {
  const { toast } = useToast();
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    fetchDeploymentLogs();
  }, []);

  const fetchDeploymentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeploymentLogs(data || []);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
    }
  };

  const handleDeployToOracle = async () => {
    setIsDeploying(true);
    
    try {
      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const isSuccessful = Math.random() > 0.3; // 70% success rate
      const totalLines = report.files.reduce((sum: number, file: any) => 
        sum + (file.convertedContent?.split('\n').length || 0), 0
      );
      
      const { data, error } = await supabase
        .from('deployment_logs')
        .insert({
          status: isSuccessful ? 'Success' : 'Failed',
          file_count: report.successfulFiles,
          lines_of_sql: totalLines,
          error_message: isSuccessful ? null : 'Connection timeout to Oracle database'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchDeploymentLogs();
      
      toast({
        title: isSuccessful ? "Deployment Successful" : "Deployment Failed",
        description: isSuccessful 
          ? `Successfully deployed ${report.successfulFiles} files to Oracle database`
          : "Failed to deploy to Oracle database. Check connection settings.",
        variant: isSuccessful ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error during deployment:', error);
      toast({
        title: "Deployment Error",
        description: "An error occurred during deployment process.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadReport = () => {
    const reportContent = generateFullReport();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Migration report has been downloaded successfully.",
    });
  };

  const generateFullReport = () => {
    return `
SYBASE TO ORACLE MIGRATION REPORT
================================

Generated: ${new Date(report.timestamp).toLocaleString()}
Migration ID: ${report.id}

SUMMARY
-------
Total Files: ${report.totalFiles}
Successful Conversions: ${report.successfulFiles}
Failed Conversions: ${report.failedFiles}
Success Rate: ${Math.round((report.successfulFiles / report.totalFiles) * 100)}%

FILE DETAILS
-----------
${report.files.map((file: any) => `
${file.name} (${file.type.toUpperCase()})
Status: ${file.conversionStatus.toUpperCase()}
${file.dataTypeMapping ? `Data Types Mapped: ${file.dataTypeMapping.length}` : ''}
${file.issues ? `Issues Found: ${file.issues.length}` : ''}
${file.performanceMetrics ? `Performance Improvement: ${file.performanceMetrics.improvementPercentage}%` : ''}
${file.errorMessage ? `Error: ${file.errorMessage}` : ''}
---
`).join('')}

DEPLOYMENT HISTORY
-----------------
${deploymentLogs.map(log => `
${new Date(log.created_at).toLocaleString()} - ${log.status}
Files: ${log.file_count}, SQL Lines: ${log.lines_of_sql}
${log.error_message ? `Error: ${log.error_message}` : ''}
---
`).join('')}

RECOMMENDATIONS
--------------
- Review all failed conversions manually
- Test converted procedures in Oracle environment
- Validate data integrity after migration
- Monitor performance after deployment
`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Migration Report</CardTitle>
            <div className="flex gap-2">
              <Button onClick={onBack} variant="outline">
                Back to Review
              </Button>
              <Button onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600">Total Files</h3>
              <p className="text-2xl font-bold">{report.totalFiles}</p>
            </Card>
            
            <Card className="p-4 text-center bg-green-50">
              <h3 className="text-sm font-medium text-green-600">Successful</h3>
              <p className="text-2xl font-bold text-green-700">{report.successfulFiles}</p>
            </Card>
            
            <Card className="p-4 text-center bg-red-50">
              <h3 className="text-sm font-medium text-red-600">Failed</h3>
              <p className="text-2xl font-bold text-red-700">{report.failedFiles}</p>
            </Card>
            
            <Card className="p-4 text-center bg-blue-50">
              <h3 className="text-sm font-medium text-blue-600">Success Rate</h3>
              <p className="text-2xl font-bold text-blue-700">
                {Math.round((report.successfulFiles / report.totalFiles) * 100)}%
              </p>
            </Card>
          </div>

          {/* File List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Processed Files</h3>
            <ScrollArea className="h-64 border rounded">
              <div className="p-4 space-y-2">
                {report.files.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {file.conversionStatus === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : file.conversionStatus === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.type} • {file.issues?.length || 0} issues
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      file.conversionStatus === 'success' ? 'default' :
                      file.conversionStatus === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {file.conversionStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Oracle Deployment
            </CardTitle>
            <Button 
              onClick={handleDeployToOracle}
              disabled={isDeploying || report.successfulFiles === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isDeploying ? 'Deploying...' : 'Deploy to Oracle'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div>
            <h3 className="text-lg font-medium mb-3">Deployment Logs</h3>
            <ScrollArea className="h-64 border rounded">
              {deploymentLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No deployment logs yet</p>
                    <p className="text-sm">Click "Deploy to Oracle" to start</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {deploymentLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ID: {log.id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Files: <strong>{log.file_count}</strong></div>
                        <div>SQL Lines: <strong>{log.lines_of_sql}</strong></div>
                      </div>
                      
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          Error: {log.error_message}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationReport;
