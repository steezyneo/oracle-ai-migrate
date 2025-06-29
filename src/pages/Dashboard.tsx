
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Upload, History as HistoryIcon, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Components
import ConnectionForm from '@/components/ConnectionForm';
import FolderUploader from '@/components/FolderUploader';
import ConversionResults from '@/components/ConversionResults';
import ConversionHistory from '@/components/ConversionHistory';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState<FileStructure[]>([]);
  const [projectName, setProjectName] = useState('');
  const [migrationId, setMigrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['upload', 'connection', 'results', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleFolderUpload = async (files: FileStructure[], name: string) => {
    try {
      setProjectName(name);
      setUploadedFiles(files);

      // Save migration to database - convert FileStructure to Json
      const { data: migration, error: migrationError } = await supabase
        .from('migrations')
        .insert({
          user_id: user?.id,
          project_name: name,
          folder_structure: files as any // Cast to any to match Json type
        })
        .select()
        .single();

      if (migrationError) {
        console.error('Error saving migration:', migrationError);
        toast({
          title: 'Error',
          description: 'Failed to save migration to database',
          variant: 'destructive',
        });
        return;
      }

      setMigrationId(migration.id);

      // Save individual files
      const filePromises = files.map(file => 
        supabase
          .from('migration_files')
          .insert({
            migration_id: migration.id,
            file_name: file.name,
            file_path: file.path,
            file_type: getFileType(file.name),
            original_content: file.content || '',
            conversion_status: 'pending'
          })
      );

      await Promise.all(filePromises);

      toast({
        title: 'Files Uploaded Successfully',
        description: `${files.length} files uploaded and ready for processing`,
      });

      setActiveTab('results');
    } catch (error) {
      console.error('Error handling folder upload:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process uploaded files',
        variant: 'destructive',
      });
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'proc':
      case 'prc':
        return 'procedure';
      case 'trig':
        return 'trigger';
      case 'tab':
        return 'table';
      default:
        return 'other';
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleConnectionComplete = (sybaseConn: any, oracleConn: any) => {
    console.log('Connections saved:', { sybaseConn, oracleConn });
    toast({
      title: 'Connections Saved',
      description: 'Database connections have been configured successfully.',
    });
    setActiveTab('upload');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
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
              <div className="flex items-center">
                <Database className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Migration Dashboard</h1>
              </div>
            </div>
            
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Connection
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="upload">
              <FolderUploader onFolderUpload={handleFolderUpload} />
            </TabsContent>

            <TabsContent value="connection">
              <ConnectionForm onComplete={handleConnectionComplete} />
            </TabsContent>

            <TabsContent value="results">
              {migrationId ? (
                <ConversionResults />
              ) : (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Files Uploaded Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Upload your Sybase files to see conversion results here.
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <ConversionHistory onBack={() => setActiveTab('upload')} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
