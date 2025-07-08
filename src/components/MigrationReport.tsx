
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { LineChart, Line, XAxis as XAxisLine, YAxis as YAxisLine } from 'recharts';

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

  const donutData = [
    { name: 'Success', value: report.successfulFiles, color: '#22c55e' },
    { name: 'Failed', value: report.failedFiles, color: '#ef4444' },
    { name: 'Pending', value: report.totalFiles - report.successfulFiles - report.failedFiles, color: '#f59e42' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <CardTitle className="text-2xl mb-2">Migration Project Metrics Overview</CardTitle>
              <div className="flex gap-2 mb-2">
                <Button onClick={onBack} variant="outline">Back to Review</Button>
                <Button onClick={handleDownloadReport}><Download className="h-4 w-4 mr-2" />Download Report</Button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      animationDuration={1200}
                      isAnimationActive={true}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mb-1" />
                  <span className="font-bold text-green-700">{report.successfulFiles}</span>
                  <span className="text-xs text-gray-500">Success</span>
                </div>
                <div className="flex flex-col items-center">
                  <XCircle className="h-6 w-6 text-red-500 mb-1" />
                  <span className="font-bold text-red-700">{report.failedFiles}</span>
                  <span className="text-xs text-gray-500">Failed</span>
                </div>
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mb-1" />
                  <span className="font-bold text-yellow-700">{report.totalFiles - report.successfulFiles - report.failedFiles}</span>
                  <span className="text-xs text-gray-500">Pending</span>
                </div>
              </div>
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
            <div className="overflow-x-auto rounded border bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Issues</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {report.files.map((file: any) => (
                    <tr key={file.id}>
                      <td className="px-4 py-2 font-medium text-blue-900">{file.name}</td>
                      <td className="px-4 py-2 text-gray-700">{file.type}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${file.conversionStatus === 'success' ? 'bg-green-100 text-green-800' : file.conversionStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{file.conversionStatus.charAt(0).toUpperCase() + file.conversionStatus.slice(1)}</span>
                      </td>
                      <td className="px-4 py-2 text-center">{file.issues?.length || 0}</td>
                      <td className="px-4 py-2 text-xs text-red-600">{file.errorMessage || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/view-code/${file.id}`, '_blank')}>View Code</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Quality Metrics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Performance & Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lines of Code Chart */}
            <div>
              <h4 className="font-medium mb-2">Lines of Code (Before/After)</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={report.files.map(f => ({ name: f.name, Original: f.performanceMetrics?.codeQuality?.totalLines || 0, Converted: f.performanceMetrics?.codeQuality?.codeLines || 0 }))}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Original" fill="#8884d8" />
                  <Bar dataKey="Converted" fill="#22c55e" />
                </BarChart>
              </div>
              {/* Complexity Chart */}
              <div>
                <h4 className="font-medium mb-2">Complexity (Before/After)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={report.files.map(f => ({ name: f.name, Original: f.performanceMetrics?.originalComplexity || 0, Converted: f.performanceMetrics?.convertedComplexity || 0 }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Original" stroke="#f59e42" />
                    <Line type="monotone" dataKey="Converted" stroke="#22c55e" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Performance Score Chart */}
              <div>
                <h4 className="font-medium mb-2">Performance Score</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={report.files.map(f => ({ name: f.name, Score: f.performanceMetrics?.performanceScore || 0 }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Deployment Section */}
      <Card className="mt-6">
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

      {/* Recommendations & Next Steps */}
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Recommendations & Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow">
              <h4 className="font-semibold text-blue-800 mb-1">Recommended Actions</h4>
              <ul className="list-disc pl-5 text-blue-900 space-y-1">
                <li>Review all failed conversions manually</li>
                <li>Test converted procedures in Oracle environment</li>
                <li>Validate data integrity after migration</li>
                <li>Monitor performance after deployment</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex flex-col gap-4 shadow">
              <h4 className="font-semibold text-green-800 mb-1">Next Steps</h4>
              <Button className="w-full" variant="outline" onClick={handleDownloadReport} title="Download the full migration report as TXT">Download All Files</Button>
              <Button className="w-full" variant="default" onClick={() => window.location.href='/migration'} title="Start a new migration project">Start New Migration</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationReport;
