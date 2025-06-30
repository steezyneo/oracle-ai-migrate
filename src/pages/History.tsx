import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Database, FileText, Home, Eye, Download, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import { format } from 'date-fns';
import CodeDiffViewer from '@/components/CodeDiffViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Migration {
  id: string;
  project_name: string;
  created_at: string;
  file_count: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
}

interface MigrationFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  original_content: string;
  converted_content: string | null;
  conversion_status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

const History = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);
  const [migrationFiles, setMigrationFiles] = useState<MigrationFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MigrationFile | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [selectedMigrations, setSelectedMigrations] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
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
        toast({
          title: "Error",
          description: "Failed to fetch migration history",
          variant: "destructive",
        });
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

  const handleBackToDashboard = () => {
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
        
      if (error) {
        console.error('Error fetching migration files:', error);
        toast({
          title: "Error",
          description: "Failed to fetch migration files",
          variant: "destructive",
        });
        return;
      }
      
      // Map the data to ensure proper typing for conversion_status
      const typedFiles: MigrationFile[] = (data || []).map(file => ({
        ...file,
        conversion_status: ['pending', 'success', 'failed'].includes(file.conversion_status) 
          ? file.conversion_status as 'pending' | 'success' | 'failed'
          : 'pending'
      }));
      
      setMigrationFiles(typedFiles);
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
      // Collapse if already selected
      setSelectedMigrationId(null);
      setMigrationFiles([]);
    } else {
      setSelectedMigrationId(migrationId);
      await fetchMigrationFiles(migrationId);
    }
  };

  // Handle file view - updated to show both codes
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

  // Toggle bulk delete mode
  const toggleBulkDeleteMode = () => {
    setBulkDeleteMode(!bulkDeleteMode);
    setSelectedMigrations(new Set());
    setSelectedFiles(new Set());
  };

  // Handle migration selection
  const handleMigrationSelect = (migrationId: string, checked: boolean) => {
    const newSelected = new Set(selectedMigrations);
    if (checked) {
      newSelected.add(migrationId);
    } else {
      newSelected.delete(migrationId);
    }
    setSelectedMigrations(newSelected);
  };

  // Handle file selection
  const handleFileSelect = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // Bulk delete migrations
  const handleBulkDeleteMigrations = async () => {
    if (selectedMigrations.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMigrations.size} migration(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const migrationIds = Array.from(selectedMigrations);
      
      // Delete migration files first
      for (const migrationId of migrationIds) {
        await supabase.from('migration_files').delete().eq('migration_id', migrationId);
      }
      
      // Delete migrations
      const { error } = await supabase
        .from('migrations')
        .delete()
        .in('id', migrationIds);
        
      if (error) {
        console.error('Error bulk deleting migrations:', error);
        toast({
          title: "Error",
          description: "Failed to delete migrations",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI
      setMigrations(prev => prev.filter(m => !selectedMigrations.has(m.id)));
      setSelectedMigrations(new Set());
      setBulkDeleteMode(false);
      
      toast({
        title: "Deleted",
        description: `Successfully deleted ${migrationIds.length} migration(s)`,
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting migrations",
        variant: "destructive",
      });
    }
  };

  // Bulk delete files
  const handleBulkDeleteFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const fileIds = Array.from(selectedFiles);
      
      const { error } = await supabase
        .from('migration_files')
        .delete()
        .in('id', fileIds);
        
      if (error) {
        console.error('Error bulk deleting files:', error);
        toast({
          title: "Error",
          description: "Failed to delete files",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI
      setMigrationFiles(prev => prev.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
      
      // Refresh migration counts
      await fetchHistory();
      
      toast({
        title: "Deleted",
        description: `Successfully deleted ${fileIds.length} file(s)`,
      });
    } catch (error) {
      console.error('Error in bulk delete files:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting files",
        variant: "destructive",
      });
    }
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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
      default:
        return 'bg-gray-100 text-gray-800';
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
            
            <div className="flex items-center gap-2">
              <Button 
                variant={bulkDeleteMode ? "default" : "outline"}
                onClick={toggleBulkDeleteMode}
                className="flex items-center gap-2"
              >
                {bulkDeleteMode ? "Exit Selection" : "Bulk Delete"}
              </Button>
              {bulkDeleteMode && (
                <>
                  {selectedMigrations.size > 0 && (
                    <Button 
                      variant="destructive"
                      onClick={handleBulkDeleteMigrations}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Migrations ({selectedMigrations.size})
                    </Button>
                  )}
                  {selectedFiles.size > 0 && (
                    <Button 
                      variant="destructive"
                      onClick={handleBulkDeleteFiles}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Files ({selectedFiles.size})
                    </Button>
                  )}
                </>
              )}
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conversion History ({migrations.length})
              {bulkDeleteMode && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Selection Mode Active
                </span>
              )}
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
                      {bulkDeleteMode && (
                        <th className="px-4 py-3 text-center">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select</span>
                        </th>
                      )}
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
                    {migrations.map((migration) => (
                      <React.Fragment key={migration.id}>
                        <tr
                          className={`cursor-pointer hover:bg-blue-50 transition ${
                            selectedMigrationId === migration.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => !bulkDeleteMode && handleRowClick(migration.id)}
                        >
                          {bulkDeleteMode && (
                            <td className="px-4 py-3 text-center">
                              <Checkbox
                                checked={selectedMigrations.has(migration.id)}
                                onCheckedChange={(checked) => handleMigrationSelect(migration.id, checked as boolean)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium text-blue-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            {migration.project_name}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {format(new Date(migration.created_at), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded">
                              {migration.file_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
                              {migration.success_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-red-100 text-red-800 rounded">
                              {migration.failed_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded">
                              {migration.pending_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {!bulkDeleteMode && (
                                <>
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
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Show files if this migration is selected */}
                        {selectedMigrationId === migration.id && migrationFiles.length > 0 && (
                          migrationFiles.map((file) => (
                            <tr key={file.id} className="bg-gray-50 hover:bg-blue-100">
                              {bulkDeleteMode && (
                                <td className="px-4 py-2 text-center">
                                  <Checkbox
                                    checked={selectedFiles.has(file.id)}
                                    onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                                  />
                                </td>
                              )}
                              <td className="px-8 py-2 text-sm flex items-center gap-2" colSpan={bulkDeleteMode ? 1 : 2}>
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="truncate max-w-xs">{file.file_name}</span>
                              </td>
                              {!bulkDeleteMode && <td></td>}
                              <td className="px-4 py-2 text-center text-xs text-gray-600">
                                {file.file_type}
                              </td>
                              <td className="px-4 py-2 text-center" colSpan={2}>
                                <div className="flex items-center justify-center gap-2">
                                  {getStatusIcon(file.conversion_status)}
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(file.conversion_status)}`}>
                                    {file.conversion_status.charAt(0).toUpperCase() + file.conversion_status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                {!bulkDeleteMode && (
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
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                        
                        {selectedMigrationId === migration.id && migrationFiles.length === 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={bulkDeleteMode ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                              No files found for this migration
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

        {/* Code Diff Dialog - Updated to show proper diff */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Code Comparison: {selectedFile?.file_name}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedFile?.conversion_status || 'pending')}`}>
                  {selectedFile?.conversion_status?.charAt(0).toUpperCase() + selectedFile?.conversion_status?.slice(1)}
                </span>
              </DialogTitle>
              <DialogClose />
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedFile && (
                <div className="space-y-4">
                  {selectedFile.converted_content ? (
                    <CodeDiffViewer
                      originalCode={selectedFile.original_content || 'No original code available'}
                      convertedCode={selectedFile.converted_content}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-700">Original Sybase Code</h4>
                        <div className="bg-gray-50 border rounded-md p-4 max-h-96 overflow-y-auto">
                          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
                            {selectedFile.original_content || 'No original code available'}
                          </pre>
                        </div>
                      </div>
                      {selectedFile.conversion_status === 'pending' && (
                        <div className="text-center py-4 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                          <p>This file hasn't been converted yet</p>
                        </div>
                      )}
                      {selectedFile.conversion_status === 'failed' && selectedFile.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <h4 className="text-sm font-medium mb-2 text-red-800">Conversion Error</h4>
                          <p className="text-sm text-red-700">{selectedFile.error_message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default History;
