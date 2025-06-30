import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Database, FileText, Calendar, User, Home, Eye, Download, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import { format } from 'date-fns';
import CodeDiffViewer from '@/components/CodeDiffViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface Migration {
  id: string;
  project_name: string;
  created_at: string;
  file_count: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
}

interface DeploymentLog {
  id: string;
  created_at: string;
  status: string;
  lines_of_sql: number;
  file_count: number;
  error_message: string | null;
}

const History = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [activeTab, setActiveTab] = useState<'migrations' | 'deployments'>('migrations');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);
  const [migrationFiles, setMigrationFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const isFetchingFiles = useRef(false);

  // Get the return tab from location state
  const returnTab = location.state?.returnTab || 'upload';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchHistory();
    }
  }, [user, loading, navigate]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch migrations with file counts
      const { data: migrationsData, error: migrationsError } = await supabase
        .from('migrations')
        .select(`
          id,
          project_name,
          created_at,
          migration_files (
            id,
            conversion_status
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (migrationsError) {
        console.error('Error fetching migrations:', migrationsError);
      } else {
        const processedMigrations = migrationsData?.map(migration => {
          const files = migration.migration_files || [];
          return {
            id: migration.id,
            project_name: migration.project_name,
            created_at: migration.created_at,
            file_count: files.length,
            success_count: files.filter((f: any) => f.conversion_status === 'success').length,
            failed_count: files.filter((f: any) => f.conversion_status === 'failed').length,
            pending_count: files.filter((f: any) => f.conversion_status === 'pending').length,
          };
        }) || [];
        
        setMigrations(processedMigrations);
      }

      // Fetch deployment logs
      const { data: logsData, error: logsError } = await supabase
        .from('deployment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) {
        console.error('Error fetching deployment logs:', logsError);
      } else {
        setDeploymentLogs(logsData || []);
      }
      
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard with the remembered tab
    navigate('/migration', { state: { activeTab: returnTab } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Fetch files for a migration
  const fetchMigrationFiles = async (migrationId: string) => {
    if (isFetchingFiles.current) return;
    isFetchingFiles.current = true;
    try {
      const { data, error } = await supabase
        .from('migration_files')
        .select('*')
        .eq('migration_id', migrationId)
        .order('file_name', { ascending: true });
      if (error) throw error;
      setMigrationFiles(data || []);
    } catch (err) {
      setMigrationFiles([]);
    } finally {
      isFetchingFiles.current = false;
    }
  };

  // Handle row click
  const handleRowClick = async (migrationId: string) => {
    setSelectedMigrationId(migrationId);
    await fetchMigrationFiles(migrationId);
  };

  // Handle file view
  const handleViewFile = (file: any) => {
    setSelectedFile(file);
    setShowCodeDialog(true);
  };

  // Delete file from database and update UI
  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase.from('migration_files').delete().eq('id', fileId);
      if (error) {
        alert('Failed to delete file from database.');
      } else {
        setMigrationFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (error) {
      alert('An error occurred while deleting the file.');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <HomeButton onClick={handleGoHome} />
              <Button 
                variant="ghost" 
                onClick={handleBackToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center">
                <Database className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Migration History</h1>
              </div>
            </div>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'migrations' ? 'default' : 'outline'}
              onClick={() => setActiveTab('migrations')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Migration Projects ({migrations.length})
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'migrations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conversion History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {migrations.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No migrations yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start your first migration project to see it here
                    </p>
                    <Button onClick={() => navigate('/migration')}>
                      Start New Migration
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {migrations.map((migration) => (
                          <React.Fragment key={migration.id}>
                            <tr
                              className={`cursor-pointer hover:bg-blue-50 transition`}
                              onClick={() => handleRowClick(migration.id)}
                            >
                              <td className="px-4 py-3 font-medium text-blue-900 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                {migration.project_name}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{format(new Date(migration.created_at), 'MMM dd, yyyy')}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block w-8 text-blue-600 bg-blue-50 rounded-full">{migration.success_count}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block w-8 text-purple-600 bg-purple-50 rounded-full">{migration.failed_count}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block w-8 text-orange-600 bg-orange-50 rounded-full">{migration.pending_count}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Success</span>
                              </td>
                              <td className="px-4 py-3 text-center flex gap-2 justify-center">
                                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleRowClick(migration.id); }}><Eye className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteFile(migration.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </td>
                            </tr>
                            {/* Show files if this migration is selected */}
                            {selectedMigrationId === migration.id && migrationFiles.length > 0 && (
                              migrationFiles.map((file) => (
                                <tr key={file.id} className="bg-gray-50 hover:bg-blue-100 cursor-pointer">
                                  <td className="px-8 py-2 text-sm flex items-center gap-2" colSpan={2} onClick={() => handleViewFile(file)}>
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    {file.file_name}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {file.conversion_status === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {file.conversion_status === 'failed' && <XCircle className="h-4 w-4 text-red-500 mx-auto" />}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {file.conversion_status === 'pending' && <AlertCircle className="h-4 w-4 text-orange-500 mx-auto" />}
                                  </td>
                                  <td className="px-4 py-2 text-center" colSpan={2}>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${file.conversion_status === 'success' ? 'bg-green-100 text-green-800' : file.conversion_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{file.conversion_status.charAt(0).toUpperCase() + file.conversion_status.slice(1)}</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Code Diff Dialog */}
                <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Code Comparison: {selectedFile?.file_name}</DialogTitle>
                      <DialogClose />
                    </DialogHeader>
                    {selectedFile && (
                      <CodeDiffViewer
                        originalCode={selectedFile.original_content || ''}
                        convertedCode={selectedFile.converted_content || ''}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
