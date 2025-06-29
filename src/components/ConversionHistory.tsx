
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, Home, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import CodeDiffViewer from './CodeDiffViewer';

interface ConversionHistoryFile {
  id: string;
  file_name: string;
  created_at: string;
  conversion_status: string;
  original_content: string;
  converted_content: string;
  issues: any[];
  error_message?: string;
}

interface ConversionHistoryProps {
  onBack: () => void;
}

const ConversionHistory: React.FC<ConversionHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<ConversionHistoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConversionHistoryFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversionHistory();
    }
  }, [user]);

  const fetchConversionHistory = async () => {
    try {
      setIsLoading(true);
      
      const { data: migrationsData, error: migrationsError } = await supabase
        .from('migrations')
        .select(`
          id,
          migration_files (
            id,
            file_name,
            created_at,
            conversion_status,
            original_content,
            converted_content,
            issues,
            error_message
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (migrationsError) {
        console.error('Error fetching conversion history:', migrationsError);
        return;
      }

      const allFiles: ConversionHistoryFile[] = [];
      migrationsData?.forEach(migration => {
        migration.migration_files?.forEach((file: any) => {
          allFiles.push({
            id: file.id,
            file_name: file.file_name,
            created_at: file.created_at,
            conversion_status: file.conversion_status,
            original_content: file.original_content || '',
            converted_content: file.converted_content || '',
            issues: file.issues || [],
            error_message: file.error_message
          });
        });
      });

      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching conversion history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFile = (file: ConversionHistoryFile) => {
    setSelectedFile(file);
  };

  const handleDownloadFile = (file: ConversionHistoryFile) => {
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
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('migration_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        console.error('Error deleting file:', error);
        return;
      }

      setFiles(files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getIssueStats = (file: ConversionHistoryFile) => {
    const issues = Array.isArray(file.issues) ? file.issues : [];
    const errors = issues.filter((issue: any) => issue.severity === 'error').length;
    const warnings = issues.filter((issue: any) => issue.severity === 'warning').length;
    const infos = issues.filter((issue: any) => issue.severity === 'info').length;
    
    return { errors, warnings, infos };
  };

  if (selectedFile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => setSelectedFile(null)}>
              Back to History
            </Button>
            <h1 className="text-2xl font-bold">{selectedFile.file_name}</h1>
          </div>
          <Badge variant={selectedFile.conversion_status === 'success' ? 'default' : 'destructive'}>
            {selectedFile.conversion_status}
          </Badge>
        </div>

        <CodeDiffViewer
          originalCode={selectedFile.original_content}
          convertedCode={selectedFile.converted_content}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <h1 className="text-2xl font-bold text-blue-600">Conversion History</h1>
          <Badge variant="outline" className="text-blue-600">
            {files.length} conversions
          </Badge>
        </div>
      </div>

      <p className="text-gray-600">
        Review your previous T-SQL to Oracle PL/SQL conversions • Click any row to load
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Conversion Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading conversion history...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No conversions yet
              </h3>
              <p className="text-gray-600">
                Start your first conversion to see it here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Errors</TableHead>
                  <TableHead className="text-center">Warnings</TableHead>
                  <TableHead className="text-center">Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => {
                  const stats = getIssueStats(file);
                  return (
                    <TableRow 
                      key={file.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewFile(file)}
                    >
                      <TableCell className="font-medium text-blue-600">
                        <FileText className="h-4 w-4 inline mr-2" />
                        {file.file_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(file.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stats.errors > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          {stats.errors}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stats.warnings > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                          {stats.warnings}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stats.infos > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                          {stats.infos}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={file.conversion_status === 'success' ? 'default' : 'destructive'}
                          className={file.conversion_status === 'success' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {file.conversion_status === 'success' ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFile(file);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionHistory;
