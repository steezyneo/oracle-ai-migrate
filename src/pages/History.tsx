import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Database, FileText, Calendar, User, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import { format } from 'date-fns';

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
            <Button
              variant={activeTab === 'deployments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('deployments')}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Deployment Logs ({deploymentLogs.length})
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'migrations' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Migration Projects
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Files</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrations.map((migration) => (
                        <TableRow key={migration.id}>
                          <TableCell className="font-medium">
                            {migration.project_name}
                          </TableCell>
                          <TableCell>{migration.file_count}</TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">
                              {migration.success_count}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600 font-medium">
                              {migration.failed_count}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600 font-medium">
                              {migration.pending_count}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(migration.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Deployment Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deploymentLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No deployments yet
                    </h3>
                    <p className="text-gray-600">
                      Deploy your migrated code to see logs here
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Files</TableHead>
                        <TableHead>SQL Lines</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Deployed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deploymentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              log.status === 'Success' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status}
                            </span>
                          </TableCell>
                          <TableCell>{log.file_count}</TableCell>
                          <TableCell>{log.lines_of_sql}</TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <span className="text-red-600 text-sm">
                                {log.error_message.substring(0, 50)}...
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
