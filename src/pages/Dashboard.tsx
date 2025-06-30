import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult } from '@/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ConversionPanel from '@/components/dashboard/ConversionPanel';
import { useConversionLogic } from '@/components/dashboard/ConversionLogic';
import { useMigrationManager } from '@/components/dashboard/MigrationManager';
import CodeUploader from '@/components/CodeUploader';
import AIModelSelector from '@/components/AIModelSelector';
import Help from '@/components/Help';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: any[];
  issues?: any[];
  performanceMetrics?: any;
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState('gemini-1.5-flash-latest');
  const [showHelp, setShowHelp] = useState(false);

  const { handleCodeUpload } = useMigrationManager();
  
  const {
    isConverting,
    convertingFileId,
    conversionProgress,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
  } = useConversionLogic(files, setFiles, setConversionResults, selectedAiModel);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const stateTab = location.state?.activeTab;
    if (stateTab) {
      setActiveTab(stateTab);
    }
  }, [user, loading, navigate, location.state]);

  const handleUploadComplete = async (uploadedFiles: any[]) => {
    const convertedFiles = await handleCodeUpload(uploadedFiles);
    setFiles(convertedFiles);
    setActiveTab('conversion');
    
    toast({
      title: "Files Ready",
      description: `${convertedFiles.length} files are ready for conversion`,
    });
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleManualEdit = (newContent: string) => {
    if (!selectedFile) return;
    
    setFiles(prev => prev.map(f => 
      f.id === selectedFile.id 
        ? { ...f, convertedContent: newContent }
        : f
    ));
    
    setSelectedFile(prev => prev ? { ...prev, convertedContent: newContent } : null);
  };

  const handleDismissIssue = (issueId: string) => {
    if (!selectedFile) return;
    
    const updatedIssues = selectedFile.issues?.filter(issue => issue.id !== issueId) || [];
    
    setFiles(prev => prev.map(f => 
      f.id === selectedFile.id 
        ? { ...f, issues: updatedIssues }
        : f
    ));
    
    setSelectedFile(prev => prev ? { ...prev, issues: updatedIssues } : null);
  };

  const handleGoToHistory = () => {
    navigate('/history', { state: { returnTab: activeTab } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleShowHelp = () => {
    setShowHelp(true);
  };

  const handleReportGenerated = async () => {
    const report = await handleGenerateReport();
    console.log('Report generated:', report);
    
    toast({
      title: "Migration Complete",
      description: "Your migration report has been generated successfully",
    });
    
    setActiveTab('report');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
      <DashboardHeader
        onGoToHistory={handleGoToHistory}
        onGoHome={handleGoHome}
        onShowHelp={handleShowHelp}
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="conversion">Convert</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
            </TabsList>
            
            <AIModelSelector
              selectedModel={selectedAiModel}
              onModelChange={setSelectedAiModel}
            />
          </div>

          <TabsContent value="upload" className="space-y-6">
            <CodeUploader onComplete={handleUploadComplete} />
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <ConversionPanel
              files={files}
              selectedFile={selectedFile}
              isConverting={isConverting}
              convertingFileId={convertingFileId}
              conversionProgress={conversionProgress}
              onFileSelect={handleFileSelect}
              onConvertFile={handleConvertFile}
              onConvertAllByType={handleConvertAllByType}
              onConvertAll={handleConvertAll}
              onFixFile={handleFixFile}
              onManualEdit={handleManualEdit}
              onDismissIssue={handleDismissIssue}
              onGenerateReport={handleReportGenerated}
              onUploadRedirect={() => setActiveTab('upload')}
            />
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Migration Report</h3>
              <p className="text-gray-600">
                Your migration report will appear here after conversion is complete.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {showHelp && (
        <Help onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
};

export default Dashboard;
