import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import ConversionIssuesPanel from './ConversionIssuesPanel';
import FileDownloader from './FileDownloader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnreviewedFiles } from '@/hooks/useUnreviewedFiles';
<<<<<<< HEAD
import { useAuth } from '@/hooks/useAuth';
=======
import CodeDiffViewer from './CodeDiffViewer';
import { diffChars } from 'diff';
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1

interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description: string;
}

interface ConversionIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  lineNumber?: number;
  suggestedFix?: string;
  originalCode?: string;
  category: string;
}

interface PerformanceMetrics {
  originalComplexity: number;
  convertedComplexity: number;
  improvementPercentage: number;
  recommendations: string[];
  performanceScore?: number;
  codeQuality?: {
    totalLines: number;
    codeLines: number;
    commentRatio: number;
    complexityLevel: 'Low' | 'Medium' | 'High';
  };
  maintainabilityIndex?: number;
  conversionTimeMs?: number;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed' | 'pending_review';
  convertedContent?: string;
  aiGeneratedCode?: string; // Add this field for human edits
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
  explanations?: string[];
  reviewStatus?: 'pending' | 'approved' | 'changes_requested';
  reviewerId?: string;
  assignedTo?: string;
  reviewComments?: { id: string; userId: string; userName: string; comment: string; createdAt: string }[];
}

interface ConversionViewerProps {
  file: FileItem;
  onManualEdit: (newContent: string) => void;
  onDismissIssue: (issueId: string) => void;
<<<<<<< HEAD
  onNavigateFile?: (fileId: string) => void;
  fileList?: FileItem[];
  onCommentAdded?: (fileId: string) => void;
=======
  onSaveEdit?: (newContent: string) => void | Promise<void>; // Accepts edited content
  hideEdit?: boolean; // Hide edit option
  onPrevFile?: () => void;
  onNextFile?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
}

const ConversionViewer: React.FC<ConversionViewerProps> = ({
  file,
  onManualEdit,
  onDismissIssue,
<<<<<<< HEAD
  onNavigateFile,
  fileList,
  onCommentAdded,
=======
  onSaveEdit,
  hideEdit,
  onPrevFile,
  onNextFile,
  hasPrev,
  hasNext,
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
}) => {
  const { toast } = useToast();
  const { addUnreviewedFile } = useUnreviewedFiles();
  const { profile: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
<<<<<<< HEAD
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [isReconverting, setIsReconverting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [assignUserId, setAssignUserId] = useState(file.assignedTo || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showCommentPrompt, setShowCommentPrompt] = useState(false);

  const currentIndex = fileList ? fileList.findIndex(f => f.id === file.id) : -1;
  const hasPrev = fileList && currentIndex > 0;
  const hasNext = fileList && fileList.length > 0 && currentIndex < fileList.length - 1;
=======
  const [isMarkedUnreviewed, setIsMarkedUnreviewed] = useState(false);
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1

  useEffect(() => {
    setEditedContent(file.convertedContent || '');
  }, [file.convertedContent]);

<<<<<<< HEAD
  useEffect(() => {
    supabase.from('profiles').select('id,username,full_name,email').then(({ data }) => {
      setAllUsers(data || []);
    });
  }, []);

  useEffect(() => {
    if (file.convertedContent && (!file.reviewComments || file.reviewComments.length === 0)) {
      setShowCommentPrompt(true);
    } else {
      setShowCommentPrompt(false);
    }
  }, [file.convertedContent, file.reviewComments]);

  // Save the edited code to the database and update UI
  const handleSaveEdit = async () => {
    onManualEdit(editedContent);
    setIsEditing(false);
    // Save to Supabase
=======
  // Helper to calculate human edit percentage (character-based)
  function getEditPercentage(aiCode: string, finalCode: string): number {
    if (!aiCode || !finalCode) return 0;
    const diff = diffChars(aiCode, finalCode);
    let changed = 0;
    let total = aiCode.length;
    diff.forEach(part => {
      if (part.added || part.removed) {
        changed += part.count || part.value.length;
      }
    });
    return total > 0 ? Math.min(100, Math.round((changed / total) * 100)) : 0;
  }
  const aiCode = (file as any).aiGeneratedCode || file.convertedContent || '';
  const finalCode = file.convertedContent || '';
  const humanEditPercent = getEditPercentage(aiCode, finalCode);

  const handleSaveEdit = async () => {
    onManualEdit(editedContent);
    setIsEditing(false);
    if (onSaveEdit) {
      await onSaveEdit(editedContent);
      return;
    }
    // Persist to Supabase
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
    if (file.id) {
      const { error } = await supabase
        .from('migration_files')
        .update({ converted_content: editedContent })
        .eq('id', file.id);
      if (error) {
        toast({
          title: 'Save Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Saved',
          description: 'Changes saved to database.',
        });
      }
    }
  };

<<<<<<< HEAD
  // Mark this file as needing review (adds to unreviewed list)
  const handleMarkAsUnreviewed = async () => {
    if (!file.convertedContent) {
      toast({
        title: "No Converted Code",
        description: "This file doesn't have converted code to mark as unreviewed.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Add to unreviewed files (user_id set by hook)
      const success = await addUnreviewedFile({
        user_id: '',
        file_name: file.name,
        converted_code: file.convertedContent,
        original_code: file.content || '',
      });
      if (success) {
        // Update file status in DB
        const { error: updateError } = await supabase
          .from('migration_files')
          .update({
            conversion_status: 'pending_review',
            updated_at: new Date().toISOString(),
          })
          .eq('id', file.id);
        if (updateError) {
          // Not critical, just warn
          console.error('Error updating file status:', updateError);
          toast({
            title: "Warning",
            description: "File added to pending actions, but status update failed.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "File Marked for Review",
            description: `${file.name} has been marked for review and added to your pending actions.`,
          });
          // Refresh file data
          if (onManualEdit) {
            onManualEdit(file.convertedContent || '');
          }
        }
      }
    } catch (error) {
      // This should be rare, but log for debugging
      console.error('Error marking file as unreviewed:', error);
      toast({
        title: "Error",
        description: "Failed to mark file for review.",
        variant: "destructive",
      });
    }
  };

  // Re-run conversion with a custom suggestion prompt
  const handleReconvertWithSuggestion = async () => {
    setIsReconverting(true);
    try {
      const customPrompt = suggestion.trim();
      // NOTE: window.handleFileReconvert is injected by parent (see dashboard logic)
      if (typeof window !== 'undefined' && (window as any).handleFileReconvert) {
        await (window as any).handleFileReconvert(file.id, customPrompt);
      }
      toast({ title: 'Reconversion started', description: 'The file is being reconverted with your suggestion.' });
      setShowSuggestionModal(false);
      setSuggestion('');
    } catch (e) {
      toast({ title: 'Reconversion failed', description: 'Could not reconvert the file.' });
    } finally {
      setIsReconverting(false);
    }
  };

  // Let the AI try to auto-fix issues in the converted code
  const handleAutoFix = async () => {
    setIsReconverting(true);
    try {
      const autoFixPrompt = 'Automatically fix any issues or errors in the following Sybase to Oracle conversion. Apply best practices and resolve warnings.';
      if (typeof window !== 'undefined' && (window as any).handleFileReconvert) {
        await (window as any).handleFileReconvert(file.id, autoFixPrompt);
      }
      toast({ title: 'Auto-fix started', description: 'The file is being auto-fixed by the AI.' });
    } catch (e) {
      toast({ title: 'Auto-fix failed', description: 'Could not auto-fix the file.' });
    } finally {
      setIsReconverting(false);
    }
  };

  // Fetch latest review comments from the database
  const fetchLatestComments = async () => {
    const { data, error } = await supabase.from('migration_files').select('review_comments').eq('id', file.id).single();
    if (!error && data && data.review_comments) {
      if (onCommentAdded) onCommentAdded(file.id);
    }
  };

=======
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
  return (
    <Card className="h-full">
      <CardHeader>
        {/* Next/Previous navigation */}
        {fileList && fileList.length > 1 && (
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={() => hasPrev && onNavigateFile && onNavigateFile(fileList[currentIndex - 1].id)} disabled={!hasPrev}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => hasNext && onNavigateFile && onNavigateFile(fileList[currentIndex + 1].id)} disabled={!hasNext}>Next</Button>
          </div>
        )}
        <CardTitle className="flex items-center justify-between">
          <span>{file.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant={
              file.conversionStatus === 'success' ? 'default' : 
              file.conversionStatus === 'failed' ? 'destructive' : 'secondary'
            }>
              {file.conversionStatus}
            </Badge>
            <Badge variant="outline">{file.type}</Badge>
            {file.convertedContent && (
              <FileDownloader
                fileName={file.name}
                content={file.convertedContent}
                fileType={file.type}
              />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="mapping">Data Types</TabsTrigger>
            <TabsTrigger value="issues">Issues {file.issues && file.issues.length > 0 && (<Badge variant="outline" className="ml-1">{file.issues.length}</Badge>)}</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
<<<<<<< HEAD
            {/* AI Explanations for Explainable AI */}
            {file.explanations && file.explanations.length > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                <h4 className="text-blue-800 font-semibold mb-1">AI Explanation</h4>
                {file.explanations.map((explanation, idx) => (
                  <p key={idx} className="text-blue-900 text-sm mb-1 whitespace-pre-line">{explanation}</p>
                ))}
=======
            {file.convertedContent ? (
              <div className="grid grid-cols-2 gap-4 relative">
                {/* Left Arrow */}
                {hasPrev && onPrevFile && (
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onPrevFile}
                    style={{ left: '-2.5rem' }}
                    aria-label="Previous file"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                {/* Right Arrow */}
                {hasNext && onNextFile && (
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-1 hover:bg-gray-100"
                    onClick={onNextFile}
                    style={{ right: '-2.5rem' }}
                    aria-label="Next file"
                  >
                    <ArrowRight className="h-6 w-6" />
                  </button>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {file.content}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 text-green-700">Converted Oracle Code:</h3>
                  {/* Human Edits Metric */}
                  {isEditing ? (
                    hideEdit ? (
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                    ) : (
                      <>
                        <Textarea
                          value={editedContent}
                          onChange={e => setEditedContent(e.target.value)}
                          className="min-h-64 font-mono text-sm mb-2"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleSaveEdit}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                        {file.convertedContent}
                      </pre>
                      {!hideEdit && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {file.content}
                </pre>
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
              </div>
            )}
            
            {/* Side-by-side code comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Sybase Code */}
              <div>
                <h3 className="text-sm font-medium mb-2">Original Sybase Code:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                  {file.content}
                </pre>
              </div>

              {/* Converted Oracle Code */}
              {file.convertedContent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-700">Converted Oracle Code:</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-96 font-mono text-sm"
                      />
                      <Button onClick={handleSaveEdit} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                      {file.convertedContent}
                    </pre>
                  )}
                </div>
              )}
            </div>
            
            {file.errorMessage && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-red-700">Error:</h3>
                <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                  {file.errorMessage}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mapping" className="space-y-4">
            {file.dataTypeMapping && file.dataTypeMapping.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Data Type Mappings</h3>
                <div className="grid gap-3">
                  {file.dataTypeMapping.map((mapping, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Sybase Type</h4>
                          <code className="bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded text-sm font-mono block">
                            {mapping.sybaseType}
                          </code>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Oracle Type</h4>
                          <code className="bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded text-sm font-mono block">
                            {mapping.oracleType}
                          </code>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 px-3 py-2 rounded">
                            {mapping.description || 'Standard type conversion'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data type mappings available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-4">
            <ConversionIssuesPanel
              issues={file.issues || []}
              onDismissIssue={onDismissIssue}
              conversionStatus={file.conversionStatus}
            />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            {/* Human Edits Metric in Performance Tab */}
            <Card className="mb-4">
              <CardContent className="py-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 rounded px-2 py-1 mb-1">Human Edits</span>
                <span className="text-2xl font-bold text-purple-700">{humanEditPercent}%</span>
                <span className="text-xs text-muted-foreground mt-1">Percentage of AI-generated code changed by a human</span>
                <div className="mt-4 w-full">
                  <h4 className="text-sm font-medium mb-2">AI-Generated Code vs. Final Code Diff (character-based)</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                    {aiCode !== finalCode ? `AI Output:\n${aiCode}\n\nFinal Code:\n${finalCode}` : 'No changes detected.'}
                  </pre>
                </div>
              </CardContent>
            </Card>
            {file.performanceMetrics ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Quantitative Performance Analysis</h3>
                
                {/* Performance Score */}
                <Card className="p-6">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Overall Performance Score</h4>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {file.performanceMetrics.performanceScore || 0}/100
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.performanceMetrics.performanceScore || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>

                {/* Complexity Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Original Complexity</h4>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {file.performanceMetrics.originalComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cyclomatic Complexity</p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Converted Complexity</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {file.performanceMetrics.convertedComplexity || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cyclomatic Complexity</p>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Improvement</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {file.performanceMetrics.improvementPercentage || 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Performance Gain</p>
                  </Card>
                </div>

                {/* Code Quality Metrics */}
                {file.performanceMetrics.codeQuality && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Code Quality Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{file.performanceMetrics.codeQuality.totalLines}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Lines</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{file.performanceMetrics.codeQuality.codeLines}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Code Lines</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{file.performanceMetrics.codeQuality.commentRatio}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Comment Ratio</p>
                      </div>
                      <div className="text-center">
                        <Badge variant={
                          file.performanceMetrics.codeQuality.complexityLevel === 'Low' ? 'default' :
                          file.performanceMetrics.codeQuality.complexityLevel === 'Medium' ? 'secondary' : 'destructive'
                        }>
                          {file.performanceMetrics.codeQuality.complexityLevel}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Complexity</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Maintainability Index */}
                {file.performanceMetrics.maintainabilityIndex && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Maintainability Index</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {file.performanceMetrics.maintainabilityIndex}/100
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-purple-600 dark:bg-purple-400 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${file.performanceMetrics.maintainabilityIndex}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {file.performanceMetrics.maintainabilityIndex >= 80 ? 'Excellent' :
                         file.performanceMetrics.maintainabilityIndex >= 60 ? 'Good' :
                         file.performanceMetrics.maintainabilityIndex >= 40 ? 'Fair' : 'Poor'} Maintainability
                      </p>
                    </div>
                  </Card>
                )}

<<<<<<< HEAD
                {/* Conversion Time */}
                {file.performanceMetrics.conversionTimeMs && (
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Conversion Time</h4>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {file.performanceMetrics.conversionTimeMs}ms
                      </p>
                    </div>
=======
                {/* Enhanced Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lines Reduced */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Lines Reduced</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {file.performanceMetrics.linesReduced || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.performanceMetrics.originalLines || 0} → {file.performanceMetrics.convertedLines || 0}
                    </p>
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
                  </Card>
                  
                  {/* Loops Reduced */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Loops Reduced</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {file.performanceMetrics.loopsReduced || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.performanceMetrics.originalLoops || 0} → {file.performanceMetrics.convertedLoops || 0}
                    </p>
                  </Card>
                  
                  {/* Conversion Time */}
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Conversion Time</h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {file.performanceMetrics.conversionTimeMs || 0}ms
                    </p>
                    <p className="text-xs text-gray-500">Processing Time</p>
                  </Card>
                </div>
                
                {/* Recommendations */}
                {file.performanceMetrics.recommendations && file.performanceMetrics.recommendations.length > 0 && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium mb-4">Performance Recommendations</h4>
                    <ul className="space-y-3">
                      {file.performanceMetrics.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-200">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No performance metrics available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Review/Collaboration Section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Review & Collaboration</h3>
          <div className="flex flex-wrap gap-4 mb-2">
            <div>
              <span className="font-medium">Review Status:</span> {file.reviewStatus || 'pending'}
            </div>
            <div>
              <span className="font-medium">Reviewer:</span> {allUsers.find(u => u.id === file.reviewerId)?.full_name || allUsers.find(u => u.id === file.reviewerId)?.username || allUsers.find(u => u.id === file.reviewerId)?.email || 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Assigned To:</span> {allUsers.find(u => u.id === file.assignedTo)?.full_name || allUsers.find(u => u.id === file.assignedTo)?.username || allUsers.find(u => u.id === file.assignedTo)?.email || 'Unassigned'}
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <select
              value={assignUserId}
              onChange={e => setAssignUserId(e.target.value)}
              className="border p-1 rounded text-sm"
              disabled={isAssigning}
            >
              <option value="">Assign to user...</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.username || u.email}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={async () => {
              setIsAssigning(true);
              await supabase.from('migration_files').update({ assigned_to: assignUserId }).eq('id', file.id);
              setIsAssigning(false);
            }} disabled={isAssigning || !assignUserId}>Assign</Button>
          </div>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="success" onClick={async () => {
              setReviewActionLoading(true);
              await supabase.from('migration_files').update({ review_status: 'approved' }).eq('id', file.id);
              setReviewActionLoading(false);
            }} disabled={reviewActionLoading}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={async () => {
              setReviewActionLoading(true);
              await supabase.from('migration_files').update({ review_status: 'changes_requested' }).eq('id', file.id);
              setReviewActionLoading(false);
            }} disabled={reviewActionLoading}>Request Changes</Button>
          </div>
          <div className="mb-2 text-xs text-gray-500">You are: {currentUser?.full_name || currentUser?.username || currentUser?.email}</div>
        </div>
      </CardContent>

      {/* Modal for suggestion input */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Reconvert with Suggestion</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4 min-h-[60px]"
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              placeholder="E.g., Use Oracle 12c+ features, optimize for performance, etc."
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowSuggestionModal(false)} disabled={isReconverting}>Cancel</Button>
              <Button size="sm" onClick={handleReconvertWithSuggestion} disabled={isReconverting || !suggestion.trim()}>Reconvert</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ConversionViewer;
