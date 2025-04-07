
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnection, CodeFile, ConversionResult, ConversionStep, ConversionReport } from '@/types';
import CodeUploader from '@/components/CodeUploader';
import ConversionResults from '@/components/ConversionResults';
import AIModelSelector from '@/components/AIModelSelector';
import ReportViewer from '@/components/ReportViewer';
import { convertSybaseToOracle, generateConversionReport } from '@/utils/conversionUtils';
import { Database as DatabaseIcon, Code, Cpu, FileSearch, FileWarning, Check, RefreshCw, Play, Download, ChevronLeft } from 'lucide-react';
import JSZip from 'jszip';

const Index = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ConversionStep>('upload');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [selectedAIModel, setSelectedAIModel] = useState<string>('default');
  const [oracleConnection, setOracleConnection] = useState<DatabaseConnection>({
    type: 'oracle',
    host: 'localhost',
    port: '1521',
    username: 'system',
    password: 'password',
    database: 'ORCL',
    connectionString: '',
  });
  
  const handleUploadComplete = (uploadedFiles: CodeFile[]) => {
    setFiles(uploadedFiles);
    startConversion(uploadedFiles);
  };
  
  const handleConversionComplete = () => {
    setCurrentStep('review');
  };
  
  const handleReviewComplete = () => {
    setCurrentStep('report');
    handleGenerateReport();
  };
  
  const handleStartOver = () => {
    setCurrentStep('upload');
    setFiles([]);
    setResults([]);
    setReport(null);
  };

  const handleGoBack = () => {
    switch (currentStep) {
      case 'review':
        setCurrentStep('upload');
        break;
      case 'report':
        setCurrentStep('review');
        break;
      default:
        break;
    }
  };
  
  const handleDownloadAllFiles = async () => {
    if (results.length === 0) {
      toast({
        title: 'No Files to Download',
        description: 'There are no converted files to download.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const zip = new JSZip();
      
      results.forEach(result => {
        const fileExtension = result.originalFile.name.includes('.') 
          ? result.originalFile.name.split('.').pop() 
          : 'sql';
        const baseName = result.originalFile.name.includes('.')
          ? result.originalFile.name.substring(0, result.originalFile.name.lastIndexOf('.'))
          : result.originalFile.name;
        
        zip.file(`${baseName}_oracle.${fileExtension}`, result.convertedCode);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'oracle_converted_files.zip';
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Files Downloaded',
        description: `Successfully downloaded ${results.length} converted files.`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to create the ZIP archive.',
        variant: 'destructive',
      });
    }
  };
  
  const handleAIReconversion = async (fileId: string, suggestion: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    toast({
      title: 'AI Reconversion',
      description: `Applying suggestion: ${suggestion}`,
    });
    
    setIsConverting(true);
    
    try {
      const newResult = await convertSybaseToOracle(file, selectedAIModel);
      
      setResults(prevResults => 
        prevResults.map(result => 
          result.originalFile.id === fileId ? newResult : result
        )
      );
      
      toast({
        title: 'Code Reconverted',
        description: 'The AI has improved the code based on your suggestion.',
      });
    } catch (error) {
      toast({
        title: 'Reconversion Failed',
        description: 'Failed to reconvert the code with AI.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleGenerateReport = () => {
    const reportText = generateConversionReport(results);
    
    const report: ConversionReport = {
      timestamp: new Date().toISOString(),
      filesProcessed: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      warningCount: results.filter(r => r.status === 'warning').length,
      errorCount: results.filter(r => r.status === 'error').length,
      results: results,
      summary: reportText,
    };
    
    setReport(report);
    
    if (currentStep !== 'report') {
      toast({
        title: 'Report Generated',
        description: 'The migration report has been generated successfully.',
      });
    }
  };
  
  const startConversion = async (filesToConvert: CodeFile[] = files) => {
    if (filesToConvert.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload files before starting conversion.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConverting(true);
    setResults([]);
    
    try {
      const newResults: ConversionResult[] = [];
      
      for (const file of filesToConvert) {
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id ? { ...f, status: 'converting' } : f
          )
        );
        
        const result = await convertSybaseToOracle(file, selectedAIModel);
        newResults.push(result);
        
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id ? 
              { ...f, status: result.status === 'error' ? 'error' : 'success' } : 
              f
          )
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setResults(newResults);
      handleConversionComplete();
      
      toast({
        title: 'Conversion Complete',
        description: `Successfully processed ${newResults.length} files.`,
      });
    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: 'An error occurred during the conversion process.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleAIModelChange = (model: string) => {
    setSelectedAIModel(model);
  };
  
  const renderStepIndicator = () => {
    const steps: { key: ConversionStep; label: string; icon: React.ReactNode }[] = [
      { key: 'upload', label: 'Upload Code', icon: <Code className="h-5 w-5" /> },
      { key: 'review', label: 'Code Review', icon: <FileSearch className="h-5 w-5" /> },
      { key: 'report', label: 'Migration Report', icon: <FileWarning className="h-5 w-5" /> },
    ];
    
    return (
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key;
            const isComplete = getStepIndex(currentStep) > getStepIndex(step.key);
            
            return (
              <div 
                key={step.key} 
                className={`flex flex-col items-center ${index < steps.length - 1 ? 'w-1/3' : ''}`}
              >
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-primary text-white' : isComplete ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : step.icon}
                </div>
                <span 
                  className={`text-xs text-center ${isActive ? 'font-medium text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </span>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      h-[2px] w-full mt-5
                      ${isComplete ? 'bg-green-500' : 'bg-muted'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const getStepIndex = (step: ConversionStep): number => {
    const steps: ConversionStep[] = ['upload', 'review', 'report'];
    return steps.indexOf(step);
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <Cpu className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">AI Code Conversion</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Upload your Sybase code files and select an AI model to convert them to Oracle.
                  </p>
                  
                  <div className="mb-8">
                    <AIModelSelector selectedModel={selectedAIModel} onModelChange={handleAIModelChange} />
                  </div>
                  
                  <div className="mb-8">
                    <CodeUploader onComplete={handleUploadComplete} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'review':
        return (
          <div className="w-full">
            <div className="mb-4">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="flex items-center gap-2 mb-4"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Upload
              </Button>
            </div>
            <ConversionResults 
              results={results}
              oracleConnection={oracleConnection}
              onRequestReconversion={handleAIReconversion}
              onGenerateReport={handleGenerateReport}
              onComplete={handleReviewComplete}
              selectedAIModel={selectedAIModel}
            />
          </div>
        );
        
      case 'report':
        return report ? (
          <ReportViewer 
            report={report}
            onBack={() => setCurrentStep('review')}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Generating report...
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DatabaseIcon className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Sybase to Oracle Migration Tool</h1>
            </div>
            
            <div className="flex gap-2">
              {results.length > 0 && (
                <Button 
                  variant="secondary" 
                  className="text-foreground hover:bg-secondary/80 border border-secondary-foreground"
                  onClick={handleDownloadAllFiles}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Files
                </Button>
              )}
              
              {currentStep !== 'upload' && (
                <Button 
                  variant="secondary" 
                  className="text-foreground hover:bg-secondary/80 border border-secondary-foreground"
                  onClick={handleStartOver}
                >
                  Start New Migration
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </main>
      
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Sybase to Oracle Migration Tool - Powered by AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
