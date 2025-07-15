
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult, ConversionReport } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCompleteMigration, setPendingCompleteMigration] = useState(false);

  const { handleCodeUpload } = useMigrationManager();
  const { unreviewedFiles, addUnreviewedFile } = useUnreviewedFiles();
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

  const handleMoveToDevReview = async () => {
    // Add all files in conversion to Dev Review (unreviewed_files)
    for (const file of files) {
      if (file.content && file.convertedContent) {
        await addUnreviewedFile({
          file_name: file.name,
          converted_code: file.convertedContent,
          original_code: file.content,
          data_type_mapping: file.dataTypeMapping,
          issues: file.issues,
          performance_metrics: file.performanceMetrics,
        });
      }
    }
    // Clear conversion files
    setFiles([]);
    setSelectedFile(null);
    setConversionResults([]);
    setActiveTab('devReview');
  };

  const handleCompleteMigration = async () => {
    if (activeTab === 'devReview' && !pendingCompleteMigration) {
      setShowConfirmModal(true);
      return;
    }
    setPendingCompleteMigration(false);
    try {
      // If in Dev Review, use unreviewedFiles for the report
      let reportResults = [];
      if (activeTab === 'devReview') {
        reportResults = unreviewedFiles.map(f => ({
          id: f.id || uuidv4(),
          originalFile: {
            id: f.id || uuidv4(),
            name: f.file_name,
            content: f.original_code,
            type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
            status: 'success',
          },
          convertedCode: f.converted_code,
          issues: f.issues || [],
          dataTypeMapping: f.data_type_mapping || [],
          performance: f.performance_metrics || {},
          status: 'success',
          explanations: [],
        }));
      } else {
        // fallback to files state (conversion tab)
        reportResults = files.map(file => ({
          id: file.id,
          originalFile: {
            id: file.id,
            name: file.name,
            content: file.content,
            type: file.type,
            status: 'success',
          },
          convertedCode: file.convertedContent || '',
          issues: file.issues || [],
          dataTypeMapping: file.dataTypeMapping || [],
          performance: file.performanceMetrics || {},
          status: file.conversionStatus === 'success' ? 'success' : file.conversionStatus === 'failed' ? 'error' : 'warning',
          explanations: [],
        }));
      }
      // Generate summary
      const reportSummary = (await import('@/utils/conversionUtils')).generateConversionReport(reportResults);
      const report = {
        timestamp: new Date().toISOString(),
        filesProcessed: reportResults.length,
        successCount: reportResults.filter(r => r.status === 'success').length,
        warningCount: reportResults.filter(r => r.status === 'warning').length,
        errorCount: reportResults.filter(r => r.status === 'error').length,
        results: reportResults,
        summary: reportSummary,
      };
      // Save to Supabase migration_reports
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('migration_reports')
        .insert({
          user_id: profile?.id,
          report: report,
        })
        .select()
        .single();
      if (error) throw error;

      // After saving the report, move all files to history and remove from unreviewed_files
      if (activeTab === 'devReview') {
        const supabaseClient = (await import('@/integrations/supabase/client')).supabase;
        // 1. Create a single migration/project for the batch
        const { data: migration, error: migrationError } = await supabaseClient
          .from('migrations')
          .insert({
            user_id: profile?.id,
            project_name: `Migration Batch: ${new Date().toLocaleString()}`
          })
          .select()
          .single();
        if (!migrationError && migration) {
          // 2. Insert all files from the report into migration_files
          const filesToInsert = reportResults.map(r => ({
            migration_id: migration.id,
            file_name: r.originalFile.name,
            file_path: r.originalFile.name,
            file_type: r.originalFile.type,
            converted_content: r.convertedCode,
            original_content: r.originalFile.content,
            conversion_status: r.status,
          }));
          await supabaseClient.from('migration_files').insert(filesToInsert);
          // 3. Remove all processed files from unreviewed_files
          const fileIds = unreviewedFiles.map(f => f.id);
          if (fileIds.length > 0) {
            await supabaseClient.from('unreviewed_files').delete().in('id', fileIds);
          }
        }
      }
      navigate(`/report/${data.id}`);
      // After navigation, clear all unreviewed files from Dev Review
      if (activeTab === 'devReview') {
        toast({
          title: "Migration Complete",
          description: "All files have been cleared from Dev Review.",
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate the conversion report",
        variant: "destructive",
      });
    }
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
            <DevReviewPanel canCompleteMigration={canCompleteMigration} onCompleteMigration={() => {
              setPendingCompleteMigration(true);
              handleCompleteMigration();
            }} />
          </TabsContent>
        </Tabs>
      </main>

      {showHelp && (
        <Help onClose={() => setShowHelp(false)} />
      )}
      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Migration?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to complete migration? All reviewed and unreviewed files will be cleared from Dev Review.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setShowConfirmModal(false); setPendingCompleteMigration(true); handleCompleteMigration(); }}>Yes, Complete Migration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
