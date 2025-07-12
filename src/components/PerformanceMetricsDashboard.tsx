import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  FileText, 
  Code, 
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ConversionResult } from '@/types';

interface PerformanceMetricsDashboardProps {
  results: ConversionResult[];
}

const PerformanceMetricsDashboard: React.FC<PerformanceMetricsDashboardProps> = ({ results }) => {
  // Calculate aggregated metrics
  const totalFiles = results.length;
  const successfulConversions = results.filter(r => r.status === 'success').length;
  const warningConversions = results.filter(r => r.status === 'warning').length;
  const errorConversions = results.filter(r => r.status === 'error').length;

  // Performance metrics calculations
  const totalLinesReduced = results.reduce((sum, result) => 
    sum + (result.performance?.linesReduced || 0), 0
  );
  const totalLoopsReduced = results.reduce((sum, result) => 
    sum + (result.performance?.loopsReduced || 0), 0
  );
  const totalConversionTime = results.reduce((sum, result) => 
    sum + (result.performance?.conversionTimeMs || 0), 0
  );
  const averageConversionTime = totalFiles > 0 ? totalConversionTime / totalFiles : 0;

  // Original vs Converted metrics
  const totalOriginalLines = results.reduce((sum, result) => 
    sum + (result.performance?.originalLines || 0), 0
  );
  const totalConvertedLines = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLines || 0), 0
  );
  const totalOriginalLoops = results.reduce((sum, result) => 
    sum + (result.performance?.originalLoops || 0), 0
  );
  const totalConvertedLoops = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLoops || 0), 0
  );

  // Complexity improvements
  const totalOriginalComplexity = results.reduce((sum, result) => 
    sum + (result.performance?.originalComplexity || 0), 0
  );
  const totalConvertedComplexity = results.reduce((sum, result) => 
    sum + (result.performance?.convertedComplexity || 0), 0
  );
  const averageComplexityReduction = totalOriginalComplexity > 0 
    ? ((totalOriginalComplexity - totalConvertedComplexity) / totalOriginalComplexity) * 100 
    : 0;

  // Performance score
  const averagePerformanceScore = results.reduce((sum, result) => 
    sum + (result.performance?.performanceScore || 0), 0
  ) / totalFiles;

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of conversion performance and optimizations
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {totalFiles} Files Processed
        </Badge>
      </div>

      {/* Conversion Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{successfulConversions}</p>
                <p className="text-xs text-muted-foreground">
                  {totalFiles > 0 ? Math.round((successfulConversions / totalFiles) * 100) : 0}% success rate
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningConversions}</p>
                <p className="text-xs text-muted-foreground">Needs review</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{errorConversions}</p>
                <p className="text-xs text-muted-foreground">Failed conversions</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lines Reduced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Lines Reduced
            </CardTitle>
            <CardDescription>
              Total lines of code optimized during conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalLinesReduced}</p>
                <p className="text-sm text-muted-foreground">Total lines reduced</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Lines</span>
                  <span className="font-medium">{totalOriginalLines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Converted Lines</span>
                  <span className="font-medium">{totalConvertedLines}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Reduction</span>
                  <span className="font-medium">
                    {totalOriginalLines > 0 ? Math.round(((totalOriginalLines - totalConvertedLines) / totalOriginalLines) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loops Reduced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Loops Reduced
            </CardTitle>
            <CardDescription>
              Loop optimizations achieved during conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{totalLoopsReduced}</p>
                <p className="text-sm text-muted-foreground">Total loops reduced</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Loops</span>
                  <span className="font-medium">{totalOriginalLoops}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Converted Loops</span>
                  <span className="font-medium">{totalConvertedLoops}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Reduction</span>
                  <span className="font-medium">
                    {totalOriginalLoops > 0 ? Math.round(((totalOriginalLoops - totalConvertedLoops) / totalOriginalLoops) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Conversion Time
            </CardTitle>
            <CardDescription>
              Performance metrics for conversion processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(averageConversionTime)}ms
                </p>
                <p className="text-sm text-muted-foreground">Average per file</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Time</span>
                  <span className="font-medium">{Math.round(totalConversionTime)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Files Processed</span>
                  <span className="font-medium">{totalFiles}</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Efficiency</span>
                  <span className="font-medium">
                    {totalFiles > 0 ? Math.round(totalConversionTime / totalFiles) : 0}ms/file
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complexity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-500" />
            Complexity Analysis
          </CardTitle>
          <CardDescription>
            Cyclomatic complexity improvements across all conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{totalOriginalComplexity}</p>
              <p className="text-sm text-muted-foreground">Original Complexity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalConvertedComplexity}</p>
              <p className="text-sm text-muted-foreground">Converted Complexity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(averageComplexityReduction)}%
              </p>
              <p className="text-sm text-muted-foreground">Complexity Reduction</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Complexity Improvement</span>
              <span>{Math.round(averageComplexityReduction)}%</span>
            </div>
            <Progress value={Math.min(Math.abs(averageComplexityReduction), 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Overall Performance Score
          </CardTitle>
          <CardDescription>
            Average performance score across all conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-indigo-600">
              {Math.round(averagePerformanceScore)}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(averagePerformanceScore)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {averagePerformanceScore >= 80 ? 'Excellent' :
               averagePerformanceScore >= 60 ? 'Good' :
               averagePerformanceScore >= 40 ? 'Fair' : 'Poor'} Performance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File-by-File Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>File Performance Breakdown</CardTitle>
          <CardDescription>
            Detailed performance metrics for each converted file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.originalFile.name}</p>
                    <p className="text-sm text-muted-foreground">{result.originalFile.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">
                      {result.performance?.linesReduced || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Lines</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">
                      {result.performance?.loopsReduced || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Loops</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-orange-600">
                      {result.performance?.conversionTimeMs || 0}ms
                    </p>
                    <p className="text-xs text-muted-foreground">Time</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetricsDashboard; 