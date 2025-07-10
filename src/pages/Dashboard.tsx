import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ConversionResult, ConversionReport } from '@/types';
import { Button } from '@/components/ui/button';

import CodeUploader from '@/components/CodeUploader';
import ReportViewer from '@/components/ReportViewer';
import Help from '@/components/Help';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ConversionPanel from '@/components/dashboard/ConversionPanel';
import PendingActionsPanel from '@/components/PendingActionsPanel';
import { useConversionLogic } from '@/components/dashboard/ConversionLogic';
import { useMigrationManager } from '@/components/dashboard/MigrationManager';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
import { supabase } from '@/lib/supabaseClient';

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
  
  const initialTab = (location.state?.activeTab as 'upload' | 'conversion' | 'pending') || 'upload';
  
  const [activeTab, setActiveTab] = useState<'upload' | 'conversion' | 'pending'>(initialTab);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-2.5-pro');
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const { handleCodeUpload, currentMigrationId, startNewMigration } = useMigrationManager();
  const { unreviewedFiles } = useUnreviewedFiles();
  const {
    isConverting,
    convertingFileIds,
    handleConvertFile,
    handleConvertAllByType,
    handleConvertAll,
    handleFixFile,
    handleGenerateReport,
  } = useConversionLogic(files, setFiles, setConversionResults, selectedAiModel, customPrompt);

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
      setReport(newReport);
      setShowReport(true);
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

  // Add this function to reset the migration/conversion state
  const handleResetMigration = async () => {
    // Delete all migration_files for the current migration from Supabase
    if (currentMigrationId) {
      const { error: fileError } = await supabase
        .from('migration_files')
        .delete()
        .eq('migration_id', currentMigrationId);
      if (fileError) {
        toast({
          title: 'Server Reset Failed',
          description: 'Could not delete migration files from the server.',
          variant: 'destructive',
        });
      } else {
        // Now delete the migration record itself
        const { error: migrationError } = await supabase
          .from('migrations')
          .delete()
          .eq('id', currentMigrationId);
        if (migrationError) {
          toast({
            title: 'Migration Record Not Deleted',
            description: 'Files were deleted, but the migration record could not be removed.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Migration Reset',
            description: 'The current migration, all files, and the migration record have been reset.',
          });
        }
      }
    } else {
      toast({
        title: 'Migration Reset',
        description: 'The current migration has been reset.',
      });
    }
    setFiles([]);
    setConversionResults([]);
    setSelectedFile(null);
    setReport(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onGoToHistory={handleGoToHistory}
        onGoHome={handleGoHome}
        onShowHelp={() => setShowHelp(true)}
        extra={<Button size="sm" onClick={() => setShowWizard(true)}>Show Wizard</Button>}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Add Reset Button at the top of the conversion panel */}
        <div className="flex justify-end mb-4">
          <Button variant="destructive" onClick={handleResetMigration} disabled={isConverting}>
            Reset Migration
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'conversion' | 'pending')}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Code
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Conversion
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 relative">
              <Clock className="h-4 w-4" />
              Pending Actions
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
              onUploadRedirect={() => setActiveTab('upload')}
            />
          </TabsContent>

          <TabsContent value="pending">
            <PendingActionsPanel />
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
