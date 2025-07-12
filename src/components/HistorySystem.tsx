import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Database, 
  FileText, 
  Home, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Play,
  Settings,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
interface Migration {
  id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  file_count: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  pending_review_count: number;
  has_converted_files: boolean;
}

interface MigrationFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'table' | 'procedure' | 'trigger' | 'other';
  original_content: string;
  converted_content: string | null;
  conversion_status: 'pending' | 'success' | 'failed' | 'pending_review';
  error_message: string | null;
  deployment_timestamp: string | null;
  data_type_mapping: any;
  performance_metrics: any;
  issues: any;
  created_at: string;
  updated_at: string;
}

interface DeploymentLog {
  id: string;
  status: 'Success' | 'Failed';
  lines_of_sql: number;
  file_count: number;
  error_message: string | null;
  created_at: string;
  migration_id: string | null;
  user_id: string | null;
}

// Code Comparison Component
const CodeComparison: React.FC<{
  originalCode: string;
  convertedCode: string;
  fileName: string;
}> = ({ originalCode, convertedCode, fileName }) => {
  return (
    <div className="grid grid-cols-2 gap-4 h-96">
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-red-600">Original (Sybase)</h4>
        <pre className="text-sm overflow-auto h-full bg-gray-50 p-3 rounded">
          {originalCode}
        </pre>
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-green-600">Converted (Oracle)</h4>
        <pre className="text-sm overflow-auto h-full bg-gray-50 p-3 rounded">
          {convertedCode || 'No converted code available'}
        </pre>
      </div>
    </div>
  );
};

// Main History System Component
export const HistorySystem: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [migrationFiles, setMigrationFiles] = useState<MigrationFile[]>([]);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MigrationFile | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('migrations');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending_review'>('all');
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
      fetchDeploymentLogs();
    }
  }, [user, loading, navigate]);

  // Fetch migration history with improved filtering
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      
      const { data: migrationsData, error: migrationsError } = await supabase
        .from('migrations')
        .select(`
          id,
          project_name,
          created_at,
          updated_at,
          migration_files (
            id,
            conversion_status,
            converted_content
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (migrationsError) {
        console.error('Error fetching migrations:', migrationsError);
        toast({
          title: "Error",
          description: "Failed to fetch migration history",
          variant: "destructive",
        });
      } else {
        const processedMigrations = migrationsData?.map(migration => {
          const files = migration.migration_files || [];
          const successFiles = files.filter((f: any) => f.conversion_status === 'success' && f.converted_content);
          const failedFiles = files.filter((f: any) => f.conversion_status === 'failed');
          const pendingFiles = files.filter((f: any) => f.conversion_status === 'pending');
          const pendingReviewFiles = files.filter((f: any) => f.conversion_status === 'pending_review');
          
          return {
            id: migration.id,
            project_name: migration.project_name,
            created_at: migration.created_at,
            updated_at: migration.updated_at,
            file_count: files.length,
            success_count: successFiles.length,
            failed_count: failedFiles.length,
            pending_count: pendingFiles.length,
            pending_review_count: pendingReviewFiles.length,
            has_converted_files: successFiles.length > 0 || pendingReviewFiles.length > 0,
          };
        }) || [];
        
        setMigrations(processedMigrations);
      }
      
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch deployment logs
  const fetchDeploymentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeploymentLogs(data || []);
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
    }
  };

  // Fetch files for a migration with deduplication
  const fetchMigrationFiles = async (migrationId: string) => {
    if (isFetchingFiles.current) return;
    isFetchingFiles.current = true;
    
    try {
      const { data, error } = await supabase
        .from('migration_files')
        .select('*')
        .eq('migration_id', migrationId)
        .order('file_name', { ascending: true });
        
      if (error) {
        console.error('Error fetching migration files:', error);
        toast({
          title: "Error",
          description: "Failed to fetch migration files",
          variant: "destructive",
        });
        return;
      }
      
      // Deduplicate files by name and only show files with actual content
      const fileMap = new Map<string, MigrationFile>();
      (data || []).forEach((file: any) => {
        const key = file.file_name.toLowerCase();
        const existingFile = fileMap.get(key);
        
        // Keep the file with the best conversion status or the most recent one
        if (!existingFile || 
            (file.conversion_status === 'success' && existingFile.conversion_status !== 'success') ||
            (file.conversion_status === existingFile.conversion_status && 
             new Date(file.updated_at) > new Date(existingFile.updated_at))) {
          fileMap.set(key, {
            ...file,
            conversion_status: ['pending', 'success', 'failed', 'pending_review'].includes(file.conversion_status) 
              ? file.conversion_status as 'pending' | 'success' | 'failed' | 'pending_review'
              : 'pending'
          });
        }
      });
      
      const deduplicatedFiles = Array.from(fileMap.values());
      setMigrationFiles(deduplicatedFiles);
    } catch (err) {
      console.error('Error in fetchMigrationFiles:', err);
      setMigrationFiles([]);
    } finally {
      isFetchingFiles.current = false;
    }
  };

  // Handle row click
  const handleRowClick = async (migrationId: string) => {
    if (selectedMigrationId === migrationId) {
      setSelectedMigrationId(null);
      setMigrationFiles([]);
    } else {
      setSelectedMigrationId(migrationId);
      await fetchMigrationFiles(migrationId);
    }
  };

  // Handle file view
  const handleViewFile = (e: React.MouseEvent, file: MigrationFile) => {
    e.stopPropagation();
    setSelectedFile(file);
    setShowCodeDialog(true);
  };

  // Handle file download
  const handleDownloadFile = (e: React.MouseEvent, file: MigrationFile) => {
    e.stopPropagation();
    
    const content = file.converted_content || file.original_content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `${file.file_name} has been downloaded`,
    });
  };

  // Delete migration
  const handleDeleteMigration = async (e: React.MouseEvent, migrationId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this migration? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete migration files first
      const { error: filesError } = await supabase
        .from('migration_files')
        .delete()
        .eq('migration_id', migrationId);
        
      if (filesError) {
        console.error('Error deleting migration files:', filesError);
        toast({
          title: "Error",
          description: "Failed to delete migration files",
          variant: "destructive",
        });
        return;
      }
      
      // Delete migration
      const { error: migrationError } = await supabase
        .from('migrations')
        .delete()
        .eq('id', migrationId);
        
      if (migrationError) {
        console.error('Error deleting migration:', migrationError);
        toast({
          title: "Error",
          description: "Failed to delete migration",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI
      setMigrations(prev => prev.filter(m => m.id !== migrationId));
      if (selectedMigrationId === migrationId) {
        setSelectedMigrationId(null);
        setMigrationFiles([]);
      }
      
      toast({
        title: "Deleted",
        description: "Migration has been deleted successfully",
      });
    } catch (error) {
      console.error('Error in handleDeleteMigration:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the migration",
        variant: "destructive",
      });
    }
  };

  // Clear all history
  const handleClearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all your migration history? This will delete all your migration files, migrations, and deployment logs. This action cannot be undone.')) {
      return;
    }
    try {
      // Delete all migration files for the user
      await supabase.from('migration_files').delete().in('migration_id',
        (await supabase.from('migrations').select('id').eq('user_id', user?.id)).data?.map(m => m.id) || []
      );
      // Delete all migrations for the user
      await supabase.from('migrations').delete().eq('user_id', user?.id);
      // Delete all deployment logs for the user
      await supabase.from('deployment_logs').delete().eq('user_id', user?.id);
      setMigrations([]);
      setMigrationFiles([]);
      setDeploymentLogs([]);
      setSelectedMigrationId(null);
      toast({ title: 'History Cleared', description: 'All your migration history has been deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear history', variant: 'destructive' });
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Navigation handlers
  const handleBackToDashboard = () => {
    navigate('/migration', { state: { activeTab: returnTab } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Filter migrations based on status
  const getFilteredMigrations = () => {
    let filtered = migrations.filter(m => m.file_count > 0 && m.has_converted_files);
    
    switch (filterStatus) {
      case 'success':
        filtered = filtered.filter(m => m.success_count > 0);
        break;
      case 'failed':
        filtered = filtered.filter(m => m.failed_count > 0);
        break;
      case 'pending_review':
        filtered = filtered.filter(m => m.pending_review_count > 0);
        break;
      default:
        // Show all migrations with converted files
        break;
    }
    
    return filtered;
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

  const filteredMigrations = getFilteredMigrations();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllHistory}
                disabled={migrations.length === 0}
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="migrations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Clean Migrations ({filteredMigrations.length})
            </TabsTrigger>
            <TabsTrigger value="deployments" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Deployments ({deploymentLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="migrations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Clean Migration History
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Migrations</SelectItem>
                        <SelectItem value="success">Successful Only</SelectItem>
                        <SelectItem value="failed">Failed Only</SelectItem>
                        <SelectItem value="pending_review">Pending Review Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMigrations.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No clean migrations yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start a new migration project and convert files to see clean history here
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredMigrations.map((migration) => (
                          <React.Fragment key={migration.id}>
                            <tr
                              className={`cursor-pointer hover:bg-blue-50 transition ${
                                selectedMigrationId === migration.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleRowClick(migration.id)}
                            >
                              <td className="px-4 py-3 font-medium text-blue-900 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                {migration.project_name}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {format(new Date(migration.created_at), 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="secondary">{migration.file_count}</Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge className="bg-green-100 text-green-800">{migration.success_count}</Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge className="bg-red-100 text-red-800">{migration.failed_count}</Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge className="bg-orange-100 text-orange-800">{migration.pending_count + migration.pending_review_count}</Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(migration.id);
                                    }}
                                    title="View Files"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => handleDeleteMigration(e, migration.id)}
                                    title="Delete Migration"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Show files if this migration is selected */}
                            {selectedMigrationId === migration.id && migrationFiles.length > 0 && (
                              migrationFiles
                                .filter(file => file.converted_content) // Only show files with converted content
                                .map((file) => (
                                <tr key={file.id} className="bg-gray-50 hover:bg-blue-100">
                                  <td className="px-8 py-2 text-sm flex items-center gap-2" colSpan={2}>
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="truncate max-w-xs">{file.file_name}</span>
                                  </td>
                                  <td className="px-4 py-2 text-center text-xs text-gray-600">
                                    {file.file_type}
                                  </td>
                                  <td className="px-4 py-2 text-center" colSpan={2}>
                                    <div className="flex items-center justify-center gap-2">
                                      {getStatusIcon(file.conversion_status)}
                                      <Badge className={getStatusColor(file.conversion_status)}>
                                        {file.conversion_status.charAt(0).toUpperCase() + file.conversion_status.slice(1)}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-center text-xs text-gray-600">
                                    {file.updated_at ? 
                                      format(new Date(file.updated_at), 'MMM dd, HH:mm') : 
                                      '-'
                                    }
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex gap-1 justify-center">
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={(e) => handleViewFile(e, file)}
                                        title="View Code"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={(e) => handleDownloadFile(e, file)}
                                        title="Download File"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                            
                            {selectedMigrationId === migration.id && migrationFiles.filter(f => f.converted_content).length === 0 && (
                              <tr className="bg-gray-50">
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                  No converted files found for this migration
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Deployment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deploymentLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No deployments yet
                    </h3>
                    <p className="text-gray-600">
                      Deploy your converted code to Oracle to see deployment logs here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deploymentLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {log.status === 'Success' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-semibold">{log.status}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Files:</span>
                            <span className="ml-2 font-medium">{log.file_count}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Lines of SQL:</span>
                            <span className="ml-2 font-medium">{log.lines_of_sql}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Migration ID:</span>
                            <span className="ml-2 font-mono text-xs">{log.migration_id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                        {log.error_message && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Code Comparison Dialog */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Code Comparison: {selectedFile?.file_name}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedFile && (
                <CodeComparison
                  originalCode={selectedFile.original_content || ''}
                  convertedCode={selectedFile.converted_content || ''}
                  fileName={selectedFile.file_name}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default HistorySystem; 