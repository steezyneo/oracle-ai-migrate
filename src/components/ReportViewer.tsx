
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConversionReport } from '@/types';

interface ReportViewerProps {
  report: ConversionReport;
  onBack: () => void;
  onSendReport?: (email: string) => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onBack,
  onSendReport,
}) => {
  const { toast } = useToast();
  
  const handleDownload = () => {
    // Create a blob with the report content
    const blob = new Blob([report.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-migration-report-${report.timestamp.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Downloaded',
      description: 'The migration report has been downloaded to your device.',
    });
  };
  
  const handleSendReport = () => {
    // In a real app, this would show a modal to enter the email address
    // For this demo, we'll simulate sending to a fixed email
    if (onSendReport) {
      onSendReport('executive@example.com');
      
      toast({
        title: 'Report Sent',
        description: 'The migration report has been sent to executive@example.com.',
      });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Migration Report</CardTitle>
              <CardDescription>
                Generated on {new Date(report.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base font-normal px-3 py-1">
              {report.successCount + report.warningCount} of {report.filesProcessed} Successful
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Success</p>
              <p className="text-2xl font-bold">{report.successCount}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Warnings</p>
              <p className="text-2xl font-bold">{report.warningCount}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Errors</p>
              <p className="text-2xl font-bold">{report.errorCount}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Processed Files</h3>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              <div className="space-y-2">
                {report.results.map(result => (
                  <div key={result.id} className="flex justify-between items-center p-2 border-b">
                    <div className="flex items-center">
                      {result.status === 'success' ? (
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                      ) : result.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span>{result.originalFile.name}</span>
                    </div>
                    <Badge>{result.originalFile.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Full Report</h3>
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-md">
              <ScrollArea className="h-[300px] p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono text-slate-800 dark:text-slate-200">
                  {report.summary}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Results
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button onClick={handleSendReport}>
                <Mail className="h-4 w-4 mr-2" />
                Send to Executive
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReportViewer;
