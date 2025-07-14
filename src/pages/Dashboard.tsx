
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult, ConversionReport } from '@/types';

import CodeUploader from '@/components/CodeUploader';
import ReportViewer from '@/components/ReportViewer';
import Help from '@/components/Help';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ConversionPanel from '@/components/dashboard/ConversionPanel';
import DevReviewPanel from '@/components/PendingActionsPanel';
import PerformanceMetricsDashboard from '@/components/PerformanceMetricsDashboard';
import { useConversionLogic } from '@/components/dashboard/ConversionLogic';
import { useMigrationManager } from '@/components/dashboard/MigrationManager';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';

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
  
  const initialTab = (location.state?.activeTab as 'upload' | 'conversion' | 'devReview' | 'metrics') || 'upload';
  
  const [activeTab, setActiveTab] = useState<'upload' | 'conversion' | 'devReview' | 'metrics'>(initialTab);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-2.5-pro');
  const [showHelp, setShowHelp] = useState(false);

  const { handleCodeUpload } = useMigrationManager();
  const { unreviewedFiles } = useUnreviewedFiles();
  const {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
  } = useConversionLogic(files, setFiles, setConversionResults, selectedAiModel);

  const canCompleteMigration = unreviewedFiles.length === 0;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const firstConvertedFile = files.find(f => f.convertedContent);
      setSelectedFile(firstConvertedFile || files[0]);
    }
  }, [files, selectedFile]);

  useEffect(() => {
    if (selectedFile && files.length > 0) {
      const updated = files.find(f => f.id === selectedFile.id);
      if (updated && updated !== selectedFile) {
        setSelectedFile(updated);
      }
    }
  }, [files, selectedFile]);

  useEffect(() => {
    // Restore conversion results and files if coming from report page
    if (location.state?.activeTab === 'conversion' && location.state?.recentReport) {
      const report = location.state.recentReport;
      setConversionResults(report.results || []);
      // Optionally, set files if your FileItem structure matches ConversionResult.originalFile
      setFiles(report.results.map((r: any) => ({
        ...r.originalFile,
        convertedContent: r.convertedCode,
        conversionStatus: r.status,
        errorMessage: r.errorMessage,
        dataTypeMapping: r.dataTypeMapping,
        issues: r.issues,
        performanceMetrics: r.performanceMetrics,
      })));
      setActiveTab('conversion');
    }
  }, [location.state]);

  const handleCodeUploadWrapper = async (uploadedFiles: any[]) => {
    const convertedFiles = await handleCodeUpload(uploadedFiles);
    setFiles(convertedFiles);
    setActiveTab('conversion');
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleDismissIssue = (issueId: string) => {
    if (!selectedFile) return;
    const fileIdx = files.findIndex(f => f.id === selectedFile.id);
    if (fileIdx === -1) return;
    const updatedIssues = selectedFile.issues?.filter(i => i.id !== issueId) || [];
    setFiles(prevFiles => prevFiles.map((f, idx) =>
      idx === fileIdx
        ? { ...f, issues: updatedIssues }
        : f
    ));
    setSelectedFile(prev => prev && prev.id === selectedFile.id
      ? { ...prev, issues: updatedIssues }
      : prev
    );
  };

  const handleManualEdit = (newContent: string) => {
    if (selectedFile) {
      const updatedFile = { ...selectedFile, convertedContent: newContent };
      
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === selectedFile.id
            ? updatedFile
            : file
        )
      );
      
      setSelectedFile(updatedFile);
    }
  };

  const handleGenerateReportWrapper = async () => {
    try {
      const newReport = await handleGenerateReport();
      navigate(`/report/${newReport.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate the conversion report",
        variant: "destructive",
      });
    }
  };

  const handleGoToHistory = () => {
    navigate('/history', { state: { returnTab: activeTab } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleResetAndUpload = () => {
    setFiles([]);
    setSelectedFile(null);
    setConversionResults([]);
    setActiveTab('upload');
  };

  const handleMoveToDevReview = () => {
    // Optionally, persist files for review here
    setActiveTab('devReview');
  };

  const handleCompleteMigration = () => {
    toast({
      title: 'Migration Completed',
      description: 'All files have been reviewed and migration is complete!',
    });
    // TODO: Add real completion logic here (e.g., update migration status, redirect, etc.)
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
      <DashboardHeader
        onGoToHistory={handleGoToHistory}
        onGoHome={handleGoHome}
        onShowHelp={() => setShowHelp(true)}
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'conversion' | 'devReview' | 'metrics')}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Code
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conversion
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="devReview" className="flex items-center gap-2 relative">
              <Clock className="h-4 w-4" />
              Dev Review
              {unreviewedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreviewedFiles.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <CodeUploader onComplete={handleCodeUploadWrapper} />
          </TabsContent>

          <TabsContent value="conversion">
            <ConversionPanel
              files={files}
              selectedFile={selectedFile}
              isConverting={isConverting}
              convertingFileIds={convertingFileIds}
              onFileSelect={handleFileSelect}
              onConvertFile={handleConvertFile}
              onConvertAllByType={handleConvertAllByType}
              onConvertAll={handleConvertAll}
              onFixFile={handleFixFile}
              onManualEdit={handleManualEdit}
              onDismissIssue={handleDismissIssue}
              onGenerateReport={handleGenerateReportWrapper}
              onUploadRedirect={handleResetAndUpload}
              onClear={handleResetAndUpload}
              onMoveToDevReview={handleMoveToDevReview}
              canCompleteMigration={canCompleteMigration}
            />
          </TabsContent>

          <TabsContent value="metrics">
            {conversionResults.length > 0 ? (
              <PerformanceMetricsDashboard results={conversionResults} />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Available</h3>
                <p className="text-gray-500 mb-4">
                  Convert some files first to see performance metrics and optimizations.
                </p>
                <button
                  onClick={() => setActiveTab('conversion')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Conversion
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="devReview">
            <DevReviewPanel canCompleteMigration={canCompleteMigration} onCompleteMigration={handleCompleteMigration} />
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
