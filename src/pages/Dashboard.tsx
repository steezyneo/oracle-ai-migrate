import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult, ConversionReport } from '@/types';
<<<<<<< HEAD
=======
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
import { Button } from '@/components/ui/button';

import CodeUploader from '@/components/CodeUploader';
import ReportViewer from '@/components/ReportViewer';
import Help from '@/components/Help';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ConversionPanel from '@/components/dashboard/ConversionPanel';
<<<<<<< HEAD
import PendingActionsPanel from '@/components/PendingActionsPanel';
import { useEnhancedConversionLogic } from '@/components/EnhancedConversionLogic';
import { useMigrationManager } from '@/components/MigrationManager';
=======
import DevReviewPanel from '@/components/PendingActionsPanel';
import PerformanceMetricsDashboard from '@/components/PerformanceMetricsDashboard';
import { useConversionLogic } from '@/components/dashboard/ConversionLogic';
import { useMigrationManager } from '@/components/dashboard/MigrationManager';
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { supabase } from '@/integrations/supabase/client';

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
  console.log("Dashboard component rendering...");
  
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
<<<<<<< HEAD
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  // Try to initialize hooks with error handling
  let migrationManager;
  let unreviewedFiles;
  let conversionLogic;
  
  try {
    migrationManager = useMigrationManager();
    unreviewedFiles = useUnreviewedFiles();
    conversionLogic = useEnhancedConversionLogic(files, setFiles, setConversionResults, selectedAiModel, customPrompt);
  } catch (error) {
    console.error('Error initializing hooks:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4" />
          <p>Error initializing dashboard. Please refresh the page.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const { handleCodeUpload, currentMigrationId, startNewMigration, cleanupEmptyMigrations } = migrationManager;
  const { unreviewedFiles: unreviewedFilesData } = unreviewedFiles;
=======
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCompleteMigration, setPendingCompleteMigration] = useState(false);

  const { handleCodeUpload } = useMigrationManager();
  const { unreviewedFiles, addUnreviewedFile, refreshUnreviewedFiles } = useUnreviewedFiles();
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
  const {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleGenerateReport,
    handleConvertSelected,
  } = conversionLogic;

  const canCompleteMigration = unreviewedFiles.length === 0;

  useEffect(() => {
    console.log("Dashboard useEffect - user:", user, "loading:", loading);
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
<<<<<<< HEAD
    // Expose a reconvert handler for ConversionViewer
    (window as any).handleFileReconvert = async (fileId: string, customPrompt: string) => {
      setCustomPrompt(customPrompt); // Set the custom prompt for this reconversion
      await handleConvertFile(fileId);
      setCustomPrompt(''); // Reset after reconversion
    };
    return () => {
      delete (window as any).handleFileReconvert;
    };
  }, [handleConvertFile]);

  useEffect(() => {
    if (!localStorage.getItem('wizardSeen')) {
      setShowWizard(true);
      localStorage.setItem('wizardSeen', '1');
    }
  }, []);

  // Clean up old empty migrations when dashboard loads
  useEffect(() => {
    if (user && !loading) {
      cleanupEmptyMigrations();
    }
  }, [user, loading, cleanupEmptyMigrations]);
=======
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

  useEffect(() => {
    // When switching to Dev Review, update conversionResults from unreviewedFiles
    if (activeTab === 'devReview' && unreviewedFiles.length > 0) {
      setConversionResults(
        unreviewedFiles.map(f => ({
          id: f.id || uuidv4(),
          originalFile: {
            id: f.id || uuidv4(),
            name: f.file_name,
            content: f.original_code,
            type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
            status: 'success',
          },
          aiGeneratedCode: f.ai_generated_code || f.converted_code || '', // Use DB field
          convertedCode: f.converted_code,
          issues: f.issues || [],
          dataTypeMapping: f.data_type_mapping || [],
          performance: f.performance_metrics || {},
          status: 'success',
          explanations: [],
        }))
      );
    }
  }, [activeTab, unreviewedFiles]);
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1

  const handleCodeUploadWrapper = async (uploadedFiles: any[]) => {
    try {
      const convertedFiles = await handleCodeUpload(uploadedFiles);
      setFiles(convertedFiles);
      setActiveTab('conversion');
    } catch (error) {
      console.error('Error in handleCodeUploadWrapper:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleFixFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    try {
      await handleConvertFile(fileId);
      toast({
        title: "File Fix Attempted",
        description: "The file has been sent for reconversion to fix issues.",
      });
    } catch (error) {
      console.error('Error fixing file:', error);
      toast({
        title: "Fix Failed",
        description: "Failed to fix the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReportWrapper = async () => {
    try {
      console.log('Starting report generation...');
      console.log('Current files:', files);
      console.log('Files with success status:', files.filter(f => f.conversionStatus === 'success'));
      
      const newReport = await handleGenerateReport();
<<<<<<< HEAD
      console.log('Generated report:', newReport);
      
      if (newReport) {
        setReport(newReport);
        setShowReport(true);
        toast({
          title: "Report Generated",
          description: "Migration report has been generated successfully",
        });
      } else {
        toast({
          title: "Report Generation Failed",
          description: "No report was generated. Please ensure you have converted files.",
          variant: "destructive",
        });
      }
=======
      navigate(`/report/${newReport.id}`);
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
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

<<<<<<< HEAD
  // Add this function to reset the migration state
  const handleResetMigration = async () => {
    setFiles([]);
    setConversionResults([]);
    setSelectedFile(null);
    setReport(null);
    setActiveTab('upload');
    try {
      await handleCodeUpload([]); // This will start a new migration session
      toast({
        title: 'Migration Reset',
        description: 'The current migration has been reset. You can start a new conversion.',
      });
    } catch (error) {
      console.error('Error resetting migration:', error);
      toast({
        title: 'Reset Error',
        description: 'Failed to reset migration. Please try again.',
        variant: "destructive",
      });
    }
  };

  console.log("Dashboard render - loading:", loading, "user:", user, "profile:", profile);

=======
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
          ai_generated_code: (file as any).aiGeneratedCode || file.convertedContent, // Store original AI output
          original_code: file.content,
          data_type_mapping: file.dataTypeMapping,
          issues: file.issues,
          performance_metrics: file.performanceMetrics || {},
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
    // No confirmation popup or pending state
    try {
      // Refresh the list to get the latest reviewed files
      await refreshUnreviewedFiles();
      // If in Dev Review, use unreviewedFiles for the report
      let reportResults = [];
      if (activeTab === 'devReview') {
        // Only include reviewed files in the report
        reportResults = unreviewedFiles
          .filter(f => f.status === 'reviewed')
          .map(f => ({
            id: f.id || uuidv4(),
            originalFile: {
              id: f.id || uuidv4(),
              name: f.file_name,
              content: f.original_code,
              type: (f.file_name.toLowerCase().includes('trig') ? 'trigger' : f.file_name.toLowerCase().includes('proc') ? 'procedure' : f.file_name.toLowerCase().includes('tab') ? 'table' : 'other'),
              status: 'success',
            },
            aiGeneratedCode: (f as any).aiGeneratedCode || f.converted_code || '', // Preserve if exists, fallback for legacy
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
          aiGeneratedCode: (file as any).aiGeneratedCode || file.convertedContent || '', // Preserve if exists, fallback for legacy
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
      // (No longer add files to migrations/migration_files here. This is now done after deployment to Oracle.)
      navigate(`/report/${data.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
    toast({
        title: "Report Generation Failed",
        description: "Failed to generate the conversion report",
        variant: "destructive",
    });
    }
  };

>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
  if (loading) {
    console.log("Dashboard showing loading state");
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
    console.log("Dashboard - no user or profile, returning null");
    return null;
  }

<<<<<<< HEAD
  if (showReport && report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          onGoToHistory={handleGoToHistory}
          onGoHome={handleGoHome}
          onShowHelp={() => setShowHelp(true)}
          title="Migration Report"
        />
        <main className="container mx-auto px-4 py-8">
          <ReportViewer 
            report={report} 
            onBack={() => setShowReport(false)} 
          />
        </main>
      </div>
    );
  }

  console.log("Dashboard rendering main content");
=======
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onGoToHistory={handleGoToHistory}
        onGoHome={handleGoHome}
        onShowHelp={() => setShowHelp(true)}
        extra={<Button size="sm" onClick={() => setShowWizard(true)}>Show Wizard</Button>}
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
            <TabsTrigger value="devReview" className="flex items-center gap-2 relative">
              <Clock className="h-4 w-4" />
<<<<<<< HEAD
              Pending Actions
              {unreviewedFilesData.length > 0 && (
=======
              Dev Review
              {unreviewedFiles.length > 0 && (
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreviewedFilesData.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <CodeUploader onComplete={handleCodeUploadWrapper} />
          </TabsContent>

          <TabsContent value="conversion">
<<<<<<< HEAD
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button variant="destructive" onClick={handleResetMigration}>
                  Reset Migration
                </Button>
              </div>
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
                onUploadRedirect={() => setActiveTab('upload')}
                onConvertSelected={handleConvertSelected}
              />
            </div>
=======
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
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
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
              handleCompleteMigration();
            }} />
          </TabsContent>
        </Tabs>
      </main>

      {showHelp && (
        <Help onClose={() => setShowHelp(false)} />
      )}

      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Migration Wizard</h2>
            <ol className="mb-6 space-y-2">
              <li className={wizardStep === 0 ? 'font-bold text-blue-600' : ''}>1. Upload your Sybase code files</li>
              <li className={wizardStep === 1 ? 'font-bold text-blue-600' : ''}>2. Convert files to Oracle</li>
              <li className={wizardStep === 2 ? 'font-bold text-blue-600' : ''}>3. Review and approve conversions</li>
              <li className={wizardStep === 3 ? 'font-bold text-blue-600' : ''}>4. Generate and export migration report</li>
            </ol>
            <div className="flex justify-between">
              <Button size="sm" variant="outline" onClick={() => setShowWizard(false)}>Close</Button>
              <Button size="sm" onClick={() => setWizardStep(s => Math.min(s + 1, 3))} disabled={wizardStep === 3}>Next</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
