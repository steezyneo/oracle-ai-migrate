import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversionResult } from '@/types';
import PerformanceMetricsDashboard from './PerformanceMetricsDashboard';

const PerformanceMetricsTest: React.FC = () => {
  const [testResults, setTestResults] = useState<ConversionResult[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Sample test data with performance metrics
  const createTestData = () => {
    const sampleResults: ConversionResult[] = [
      {
        id: '1',
        originalFile: {
          id: '1',
          name: 'sample_sybase_procedure.sql',
          content: '-- Sample Sybase procedure with multiple loops',
          type: 'procedure',
          status: 'success'
        },
        convertedCode: '-- Converted Oracle procedure',
        issues: [],
        status: 'success',
        performance: {
          originalComplexity: 15,
          convertedComplexity: 8,
          improvementPercentage: 47,
          conversionTimeMs: 1250,
          performanceScore: 85,
          maintainabilityIndex: 75,
          linesReduced: 12,
          loopsReduced: 3,
          originalLines: 85,
          convertedLines: 73,
          originalLoops: 5,
          convertedLoops: 2,
          codeQuality: {
            totalLines: 73,
            codeLines: 65,
            commentRatio: 11,
            complexityLevel: 'Medium'
          },
          recommendations: [
            'Code optimization: 12 lines reduced',
            'Loop optimization: 3 loops reduced',
            'Consider breaking down complex procedures into smaller functions'
          ]
        }
      },
      {
        id: '2',
        originalFile: {
          id: '2',
          name: 'employee_update.sql',
          content: '-- Employee update procedure',
          type: 'procedure',
          status: 'success'
        },
        convertedCode: '-- Converted employee update',
        issues: [],
        status: 'success',
        performance: {
          originalComplexity: 8,
          convertedComplexity: 4,
          improvementPercentage: 50,
          conversionTimeMs: 890,
          performanceScore: 92,
          maintainabilityIndex: 82,
          linesReduced: 8,
          loopsReduced: 2,
          originalLines: 45,
          convertedLines: 37,
          originalLoops: 3,
          convertedLoops: 1,
          codeQuality: {
            totalLines: 37,
            codeLines: 32,
            commentRatio: 14,
            complexityLevel: 'Low'
          },
          recommendations: [
            'Code optimization: 8 lines reduced',
            'Loop optimization: 2 loops reduced',
            'Add more comments to improve code maintainability'
          ]
        }
      },
      {
        id: '3',
        originalFile: {
          id: '3',
          name: 'data_processing.sql',
          content: '-- Data processing procedure',
          type: 'procedure',
          status: 'warning'
        },
        convertedCode: '-- Converted data processing',
        issues: [
          {
            id: 'issue-1',
            description: 'High complexity detected',
            severity: 'warning',
            lineNumber: 1
          }
        ],
        status: 'warning',
        performance: {
          originalComplexity: 12,
          convertedComplexity: 9,
          improvementPercentage: 25,
          conversionTimeMs: 1560,
          performanceScore: 78,
          maintainabilityIndex: 68,
          linesReduced: 5,
          loopsReduced: 1,
          originalLines: 62,
          convertedLines: 57,
          originalLoops: 4,
          convertedLoops: 3,
          codeQuality: {
            totalLines: 57,
            codeLines: 50,
            commentRatio: 12,
            complexityLevel: 'Medium'
          },
          recommendations: [
            'Code optimization: 5 lines reduced',
            'Loop optimization: 1 loop reduced',
            'Consider modularizing large code blocks'
          ]
        }
      }
    ];

    setTestResults(sampleResults);
    setShowDashboard(true);
  };

  const clearTestData = () => {
    setTestResults([]);
    setShowDashboard(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics Test</CardTitle>
          <CardDescription>
            Test the performance metrics calculation with sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={createTestData}>
                Load Test Data
              </Button>
              <Button variant="outline" onClick={clearTestData}>
                Clear Test Data
              </Button>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {testResults.length} Test Files
                  </Badge>
                  <Badge variant="outline">
                    {testResults.filter(r => r.status === 'success').length} Successful
                  </Badge>
                  <Badge variant="outline">
                    {testResults.filter(r => r.status === 'warning').length} Warnings
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {testResults.reduce((sum, r) => sum + (r.performance?.linesReduced || 0), 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Lines Reduced</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {testResults.reduce((sum, r) => sum + (r.performance?.loopsReduced || 0), 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Loops Reduced</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {Math.round(testResults.reduce((sum, r) => sum + (r.performance?.conversionTimeMs || 0), 0) / testResults.length)}ms
                        </p>
                        <p className="text-sm text-muted-foreground">Average Conversion Time</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showDashboard && testResults.length > 0 && (
        <PerformanceMetricsDashboard results={testResults} />
      )}
    </div>
  );
};

export default PerformanceMetricsTest; 