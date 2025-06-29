import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface ConversionIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  lineNumber?: number;
  suggestedFix?: string;
  originalCode?: string;
  category: string;
}

interface ConversionIssuesPanelProps {
  issues: ConversionIssue[];
  onDismissIssue: (issueId: string) => void;
}

const ConversionIssuesPanel: React.FC<ConversionIssuesPanelProps> = ({
  issues,
  onDismissIssue
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filteredIssues = issues.filter(issue => 
    filter === 'all' || issue.severity === filter
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getIssueCount = (severity: 'error' | 'warning' | 'info') => {
    return issues.filter(issue => issue.severity === severity).length;
  };

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Conversion Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">No issues found!</p>
            <p className="text-gray-500 text-sm">The conversion completed successfully.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Conversion Issues ({issues.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({issues.length})
            </Button>
            <Button
              variant={filter === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('error')}
              className="text-red-600"
            >
              Errors ({getIssueCount('error')})
            </Button>
            <Button
              variant={filter === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
              className="text-yellow-600"
            >
              Warnings ({getIssueCount('warning')})
            </Button>
            <Button
              variant={filter === 'info' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('info')}
              className="text-blue-600"
            >
              Info ({getIssueCount('info')})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredIssues.map((issue) => (
            <Alert key={issue.id} variant={getSeverityColor(issue.severity) as any}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {getSeverityIcon(issue.severity)}
                    <span className="uppercase text-xs font-semibold">
                      {issue.severity}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {issue.category}
                    </Badge>
                    {issue.lineNumber && (
                      <span className="text-sm text-gray-500">
                        Line {issue.lineNumber}
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-2">{issue.description}</p>
                    
                    {issue.originalCode && issue.suggestedFix && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm font-medium mb-1 text-red-700">
                              Original Code:
                            </p>
                            <code className="text-xs bg-red-100 px-2 py-1 rounded block">
                              {issue.originalCode}
                            </code>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1 text-green-700">
                              Suggested Fix:
                            </p>
                            <code className="text-xs bg-green-100 px-2 py-1 rounded block">
                              {issue.suggestedFix}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismissIssue(issue.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionIssuesPanel;
