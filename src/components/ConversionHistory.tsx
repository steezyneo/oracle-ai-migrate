
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Trash2, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CodeDiffViewer from './CodeDiffViewer';

interface ConversionFile {
  id: string;
  file_name: string;
  created_at: string;
  conversion_status: string;
  original_content: string | null;
  converted_content: string | null;
  file_type: string;
  issues: any[] | null;
}

interface ConversionHistoryProps {
  onBack: () => void;
}

const ConversionHistory: React.FC<ConversionHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConversionFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversionHistory();
    }
  }, [user]);

  const fetchConversionHistory = async () => {
    try {
      setIsLoading(true);
      
      // Get user's migrations first
      const { data: migrations, error: migrationsError } = await supabase
        .from('migrations')
        .select('id')
        .eq('user_id', user?.id);

      if (migrationsError) {
        console.error('Error fetching migrations:', migrationsError);
        return;
      }

      if (!migrations || migrations.length === 0) {
        setFiles([]);
        return;
      }

      const migrationIds = migrations.map(m => m.id);

      // Fetch files from all user's migrations
      const { data: filesData, error: filesError } = await supabase
        .from('migration_files')
        .select('*')
        .in('migration_id', migrationIds)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('Error fetching conversion files:', filesError);
        toast({
          title: "Error",
          description: "Failed to fetch conversion history",
          variant: "destructive",
        });
      } else {
        setFiles(filesData || []);
      }
    } catch (error) {
      console.error('Error fetching conversion history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFile = (file: ConversionFile) => {
    setSelectedFile(file);
  };

  const handleDownload = (file: ConversionFile) => {
    if (!file.converted_content) {
      toast({
        title: "No Content",
        description: "This file doesn't have converted content to download",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([file.converted_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${file.file_name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `${file.file_name} has been downloaded`,
    });
  };

  const handleDelete = async (file: ConversionFile) => {
    try {
      const { error } = await supabase
        .from('migration_files')
        .delete()
        .eq('id', file.id);

      if (error) {
        console.error('Error deleting file:', error);
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        });
      } else {
        setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
        toast({
          title: "Deleted",
          description: `${file.file_name} has been deleted`,
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIssueCount = (issues: any[] | null) => {
    if (!issues || !Array.isArray(issues)) return { errors: 0, warnings: 0, info: 0 };
    
    const errors = issues.filter(issue => issue.severity === 'error').length;
    const warnings = issues.filter(issue => issue.severity === 'warning').length;
    const info = issues.filter(issue => issue.severity === 'info').length;
    
    return { errors, warnings, info };
  };

  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedFile(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
          <h2 className="text-xl font-semibold">{selectedFile.file_name}</h2>
          {getStatusBadge(selectedFile.conversion_status)}
        </div>

        <CodeDiffViewer
          originalCode={selectedFile.original_content || 'No original content available'}
          convertedCode={selectedFile.converted_content || 'No converted content available'}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Conversion History
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Review your previous T-SQL to Oracle PL/SQL conversions • Click any row to load
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Badge variant="outline" className="text-sm">
              {files.length} conversions
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading conversion history...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No conversion history found</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">File Name</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium text-center">Errors</TableHead>
                  <TableHead className="font-medium text-center">Warnings</TableHead>
                  <TableHead className="font-medium text-center">Info</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => {
                  const issueCount = getIssueCount(file.issues);
                  return (
                    <TableRow key={file.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-blue-600">
                        {file.file_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(file.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={issueCount.errors > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {issueCount.errors}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={issueCount.warnings > 0 ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                          {issueCount.warnings}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={issueCount.info > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                          {issueCount.info}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(file.conversion_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewFile(file)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(file)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(file)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionHistory;
