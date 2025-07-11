import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertTriangle, Download, Upload, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ConversionReport } from '@/types';
import { deployToOracle } from '@/utils/databaseUtils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(() => report.results.map(r => r.id));
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'impact' | 'full'>('overview');
  const [isCompleting, setIsCompleting] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [currentMigrationId, setCurrentMigrationId] = useState<string | null>(null);
  
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
          migration_id: currentMigrationId,
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

  const handleToggleFile = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFileIds(report.results.map(r => r.id));
  };
  
  const handleDeselectAll = () => {
    setSelectedFileIds([]);
  };

  const handleDeploy = async () => {
    if (selectedFileIds.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to deploy.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    try {
      // Calculate lines of SQL and file count from the selected files
      const selectedResults = report.results.filter(r => selectedFileIds.includes(r.id));
      const linesOfSql = selectedResults.reduce((sum, r) => sum + (r.convertedCode?.split('\n').length || 0), 0);
      const fileCount = selectedResults.length;
      let allSuccess = true;
      
      for (const result of selectedResults) {
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
        
        if (deployResult.success) {
          // Update existing migration_files record to mark as deployed and set deployment timestamp
          const deploymentTimestamp = new Date().toISOString();
          const { error: updateError } = await supabase.from('migration_files').update({
            conversion_status: 'deployed',
            deployment_timestamp: deploymentTimestamp
          }).eq('file_name', result.originalFile.name).eq('migration_id', currentMigrationId);
          if (updateError) {
            console.error('Error updating deployment status:', updateError);
          }
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
        description: allSuccess ? 'All selected files deployed successfully.' : 'Some files failed to deploy.',
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

  const handleCompleteMigration = async () => {
    if (!user || migrationCompleted) return;
    setIsCompleting(true);
    try {
      // 1. Create migration entry
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user.id,
          project_name: `Migration_${new Date(report.timestamp).toLocaleString()}`
        })
        .select()
        .single();
      if (migrationError) throw migrationError;
      
      setCurrentMigrationId(migration.id);
      // Update all migration_files rows for this user and project to have the correct migration_id
      await supabase.from('migration_files').update({ migration_id: migration.id })
        .is('migration_id', null)
        .eq('file_name', report.results.map(r => r.originalFile.name));
    } catch (error) {
      console.error('Error completing migration:', error);
      toast({
        title: 'Migration Failed',
        description: 'Could not save migration history.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Migration Report</CardTitle>
          <CardDescription>
            Generated on {new Date(report.timestamp).toLocaleString()} | Report ID: {report.timestamp.split('T')[0]}-{Date.now().toString().slice(-6)}
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <Button size="sm" variant={activeTab === 'overview' ? 'default' : 'outline'} onClick={() => setActiveTab('overview')}>Overview</Button>
            <Button size="sm" variant={activeTab === 'details' ? 'default' : 'outline'} onClick={() => setActiveTab('details')}>File Details</Button>
            <Button size="sm" variant={activeTab === 'impact' ? 'default' : 'outline'} onClick={() => setActiveTab('impact')}>Change Impact</Button>
            <Button size="sm" variant={activeTab === 'full' ? 'default' : 'outline'} onClick={() => setActiveTab('full')}>Full Report</Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleDownload} variant="outline">
              Download TXT
            </Button>
            <Button size="sm" onClick={() => {
              const doc = new jsPDF();
              doc.text('Oracle Migration Report', 10, 10);
              doc.text(report.summary, 10, 20);
              doc.save(`oracle-migration-report-${report.timestamp.split('T')[0]}.pdf`);
              toast({ title: 'PDF Exported', description: 'The migration report has been exported as PDF.' });
            }} variant="outline">
              Export PDF
            </Button>
            <Button size="sm" onClick={() => {
              const ws = XLSX.utils.json_to_sheet(report.results.map(r => ({
                File: r.originalFile.name,
                Status: r.status,
                Improvement: r.performance?.improvementPercentage || 0,
                Issues: r.issues.length,
              })));
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Report');
              XLSX.writeFile(wb, `oracle-migration-report-${report.timestamp.split('T')[0]}.xlsx`);
              toast({ title: 'Excel Exported', description: 'The migration report has been exported as Excel.' });
            }} variant="outline">
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Migration Progress Pie Chart */}
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-semibold mb-2">Migration Progress</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Success', value: report.successCount },
                        { name: 'Warning', value: report.warningCount },
                        { name: 'Error', value: report.errorCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-4">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{report.successCount}</p>
                    <p className="text-gray-600">Success</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{report.warningCount}</p>
                    <p className="text-gray-600">Warning</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{report.errorCount}</p>
                    <p className="text-gray-600">Error</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'details' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Processed Files</h3>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>Select All</Button>
                <Button size="sm" variant="outline" onClick={handleDeselectAll}>Deselect All</Button>
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {report.results.map(result => (
                    <div key={result.id} className="flex justify-between items-center p-2 border-b">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedFileIds.includes(result.id)}
                          onChange={() => handleToggleFile(result.id)}
                          id={`select-file-${result.id}`}
                        />
                        {result.status === 'success' ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : result.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <label htmlFor={`select-file-${result.id}`}>{result.originalFile.name}</label>
                      </div>
                      <Badge>{result.originalFile.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          {activeTab === 'impact' && (
            <div className="space-y-8">
              <h4 className="text-lg font-semibold mb-2">Change Impact Analysis</h4>
              {/* Most affected objects by type/name */}
              <div>
                <h5 className="font-medium mb-1">Most Affected Objects</h5>
                <ul className="list-disc pl-6">
                  {getMostAffectedObjects(report).map((obj, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="font-semibold">{obj.type}:</span> {obj.name} ({obj.issues} issues, {obj.improvement}% improvement)
                    </li>
                  ))}
                </ul>
              </div>
              {/* Files with most issues */}
              <div>
                <h5 className="font-medium mb-1">Files with Most Issues</h5>
                <ul className="list-disc pl-6">
                  {getFilesWithMostIssues(report).map((f, idx) => (
                    <li key={idx} className="mb-1">
                      {f.name} - {f.issues} issues
                    </li>
                  ))}
                </ul>
              </div>
              {/* Largest performance changes */}
              <div>
                <h5 className="font-medium mb-1">Largest Performance Changes</h5>
                <ul className="list-disc pl-6">
                  {getLargestPerformanceChanges(report).map((f, idx) => (
                    <li key={idx} className="mb-1">
                      {f.name} - {f.improvement}% improvement
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'full' && (
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
          )}
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Deployment Logs</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFileIds.length} of {report.results.length} files selected
                </span>
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying || selectedFileIds.length === 0}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isDeploying ? 'Deploying...' : `Deploy ${selectedFileIds.length} Files to Oracle`}
                </Button>
              </div>
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
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Results
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button
                onClick={handleCompleteMigration}
                disabled={isCompleting || migrationCompleted}
                variant="default"
                title="Save this migration to history"
              >
                {migrationCompleted ? 'Migration Saved' : isCompleting ? 'Saving...' : 'Complete Migration'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// Helper functions for impact analysis
function getMostAffectedObjects(report: ConversionReport) {
  // Aggregate by type/name, sum issues and improvements
  const map: any = {};
  report.results.forEach(r => {
    const key = `${r.originalFile.type}:${r.originalFile.name}`;
    if (!map[key]) map[key] = { type: r.originalFile.type, name: r.originalFile.name, issues: 0, improvement: 0 };
    map[key].issues += r.issues.length;
    if (r.performance?.improvementPercentage) {
      map[key].improvement += r.performance.improvementPercentage;
    }
  });
  return Object.values(map).sort((a: any, b: any) => b.issues - a.issues).slice(0, 5);
}

function getFilesWithMostIssues(report: ConversionReport) {
  return report.results
    .map(r => ({ name: r.originalFile.name, issues: r.issues.length }))
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 5);
}

function getLargestPerformanceChanges(report: ConversionReport) {
  return report.results
    .filter(r => r.performance?.improvementPercentage)
    .map(r => ({ name: r.originalFile.name, improvement: r.performance!.improvementPercentage! }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);
}

export default ReportViewer;
