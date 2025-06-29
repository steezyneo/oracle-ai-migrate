
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Database, Clock, AlertTriangle, Check, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FileDownloader from './FileDownloader';

interface MigrationFile {
  id: string;
  file_name: string;
  file_type: string;
  original_content: string;
  converted_content: string;
  conversion_status: string;
  data_type_mapping: any;
  issues: any;
  performance_metrics: any;
  syntax_differences: any;
  error_message: string;
}

interface Migration {
  id: string;
  project_name: string;
  created_at: string;
  files: MigrationFile[];
  report?: {
    report_content: string;
    efficiency_metrics: any;
  };
}

interface MigrationDetailViewProps {
  migrationId: string;
  onBack: () => void;
}

const MigrationDetailView: React.FC<MigrationDetailViewProps> = ({ migrationId, onBack }) => {
  const [migration, setMigration] = useState<Migration | null>(null);
  const [selectedFile, setSelectedFile] = useState<MigrationFile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMigrationDetails();
  }, [migrationId]);

  const fetchMigrationDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch migration with files
      const { data: migrationData, error: migrationError } = await supabase
        .from('migrations')
        .select(`
          id,
          project_name,
          created_at,
          migration_files (
            id,
            file_name,
            file_type,
            original_content,
            converted_content,
            conversion_status,
            data_type_mapping,
            issues,
            performance_metrics,
            syntax_differences,
            error_message
          )
        `)
        .eq('id', migrationId)
        .single();

      if (migrationError) {
        console.error('Error fetching migration:', migrationError);
        toast({
          title: 'Error',
          description: 'Failed to load migration details',
          variant: 'destructive',
        });
        return;
      }

      // Fetch migration report
      const { data: reportData } = await supabase
        .from('migration_reports')
        .select('report_content, efficiency_metrics')
        .eq('migration_id', migrationId)
        .single();

      const migration: Migration = {
        id: migrationData.id,
        project_name: migrationData.project_name,
        created_at: migrationData.created_at,
        // Convert the database files to proper format
        files: (migrationData.migration_files || []).map((file: any) => ({
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          original_content: file.original_content,
          converted_content: file.converted_content,
          conversion_status: file.conversion_status,
          data_type_mapping: file.data_type_mapping || {},
          issues: Array.isArray(file.issues) ? file.issues : [],
          performance_metrics: file.performance_metrics || {},
          syntax_differences: file.syntax_differences || {},
          error_message: file.error_message || '',
        })),
        report: reportData || undefined,
      };

      setMigration(migration);
      if (migration.files.length > 0) {
        setSelectedFile(migration.files[0]);
      }
    } catch (error) {
      console.error('Error fetching migration details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load migration details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading migration details...</p>
        </div>
      </div>
    );
  }

  if (!migration) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Migration Not Found</h3>
        <p className="text-gray-600 mb-4">The requested migration could not be found.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{migration.project_name}</h1>
            <p className="text-gray-600">
              Created on {new Date(migration.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {migration.files.length} Files
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {migration.files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-md cursor-pointer border transition-colors ${
                        selectedFile?.id === file.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(file.conversion_status)}
                          <span className="font-medium text-sm">{file.file_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {file.file_type}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(file.conversion_status)}`}>
                          {file.conversion_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* File Details */}
        <div className="lg:col-span-3">
          {selectedFile ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedFile.file_name}</CardTitle>
                    <CardDescription>
                      Status: {selectedFile.conversion_status} | Type: {selectedFile.file_type}
                    </CardDescription>
                  </div>
                  <FileDownloader
                    fileName={selectedFile.file_name}
                    content={selectedFile.converted_content || selectedFile.original_content}
                    fileType={selectedFile.file_type as any}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code">
                  <TabsList className="mb-4">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="mapping">Data Type Mapping</TabsTrigger>
                    <TabsTrigger value="syntax">Syntax Differences</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Original Code</h4>
                        <ScrollArea className="h-[400px] border rounded-md">
                          <pre className="p-4 text-sm">
                            {selectedFile.original_content || 'No original content available'}
                          </pre>
                        </ScrollArea>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Converted Code</h4>
                        <ScrollArea className="h-[400px] border rounded-md">
                          <pre className="p-4 text-sm">
                            {selectedFile.converted_content || 'No converted content available'}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mapping">
                    {selectedFile.data_type_mapping && Object.keys(selectedFile.data_type_mapping).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>T-SQL (Sybase)</TableHead>
                            <TableHead>PL/SQL (Oracle)</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedFile.data_type_mapping).map(([key, mapping]: [string, any]) => (
                            <TableRow key={key}>
                              <TableCell className="font-mono">{mapping.original || key}</TableCell>
                              <TableCell className="font-mono">{mapping.converted || 'N/A'}</TableCell>
                              <TableCell>{mapping.usage || 'General'}</TableCell>
                              <TableCell>{mapping.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No data type mapping information available
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="syntax">
                    {selectedFile.syntax_differences && Object.keys(selectedFile.syntax_differences).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>T-SQL Syntax</TableHead>
                            <TableHead>PL/SQL Syntax</TableHead>
                            <TableHead>Example</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedFile.syntax_differences).map(([key, diff]: [string, any]) => (
                            <TableRow key={key}>
                              <TableCell>{diff.category || key}</TableCell>
                              <TableCell className="font-mono">{diff.tsql || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{diff.plsql || 'N/A'}</TableCell>
                              <TableCell className="font-mono">{diff.example || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No syntax differences information available
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="issues">
                    {selectedFile.issues && selectedFile.issues.length > 0 ? (
                      <div className="space-y-4">
                        {selectedFile.issues.map((issue: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {issue.severity === 'error' ? (
                                  <X className="h-4 w-4 text-red-500" />
                                ) : issue.severity === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <Check className="h-4 w-4 text-blue-500" />
                                )}
                                <Badge variant={issue.severity === 'error' ? 'destructive' : 'outline'}>
                                  {issue.severity}
                                </Badge>
                                {issue.lineNumber && (
                                  <span className="text-sm text-gray-500">Line {issue.lineNumber}</span>
                                )}
                              </div>
                            </div>
                            <p className="mt-2">{issue.description}</p>
                            {issue.suggestedFix && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <p className="text-sm font-medium mb-1">Suggested Fix:</p>
                                <code className="text-sm">{issue.suggestedFix}</code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No issues found for this file
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="performance">
                    {selectedFile.performance_metrics && Object.keys(selectedFile.performance_metrics).length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Original Complexity</p>
                            <p className="text-2xl font-bold">{selectedFile.performance_metrics.originalComplexity || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Converted Complexity</p>
                            <p className="text-2xl font-bold">{selectedFile.performance_metrics.convertedComplexity || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Improvement</p>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedFile.performance_metrics.improvementPercentage || 0}%
                            </p>
                          </div>
                        </div>
                        {selectedFile.performance_metrics.notes && (
                          <div>
                            <h4 className="font-medium mb-2">Performance Notes</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedFile.performance_metrics.notes.map((note: string, index: number) => (
                                <li key={index} className="text-sm">{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No performance metrics available
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a file to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Migration Report */}
      {migration.report && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <pre className="text-sm whitespace-pre-wrap">
                {migration.report.report_content}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MigrationDetailView;
