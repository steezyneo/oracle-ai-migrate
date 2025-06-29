import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Zap, Shield, Clock, Users, ArrowRight, History, HelpCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/migration');
    } else {
      navigate('/auth');
    }
  };

  const handleGoToHistory = () => {
    if (user) {
      navigate('/history');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Sybase to Oracle Migration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" onClick={handleGoToHistory}>
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <Button onClick={() => navigate('/migration')}>
                    Go to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <HelpCircle className="h-6 w-6 mr-2 text-primary" />
                Help & Documentation
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Getting Started */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Getting Started</h3>
                <div className="space-y-3 text-gray-600">
                  <p>Welcome to the Sybase to Oracle Migration Platform! This tool helps you convert your Sybase SQL code to Oracle PL/SQL using advanced AI technology.</p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Quick Start Guide:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>Sign up or log in to your account</li>
                      <li>Upload your Sybase SQL files (individual files or entire folders)</li>
                      <li>Select your preferred AI model for conversion</li>
                      <li>Review the converted Oracle code and analysis</li>
                      <li>Download the converted files and migration report</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Supported File Types */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Supported File Types</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Input Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-gray-600">
                        <li>• .sql files (Sybase SQL)</li>
                        <li>• .prc files (Stored Procedures)</li>
                        <li>• .trg files (Triggers)</li>
                        <li>• .fnc files (Functions)</li>
                        <li>• .vw files (Views)</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Output Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-gray-600">
                        <li>• .sql files (Oracle PL/SQL)</li>
                        <li>• .txt files (Migration Reports)</li>
                        <li>• .json files (Analysis Data)</li>
                        <li>• .zip files (Bulk Downloads)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">AI-Powered Conversion</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Advanced AI models automatically convert Sybase SQL syntax to Oracle PL/SQL with high accuracy and intelligent error detection.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Comprehensive Analysis</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Detailed reports on data type mappings, performance improvements, and potential issues with suggested fixes.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Security & Privacy</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Your code is processed securely with user isolation, encrypted data handling, and comprehensive audit trails.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Fast Processing</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Reduce migration time from months to weeks with automated conversion and intelligent code optimization.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Common Issues */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Common Issues & Solutions</h3>
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">File Upload Issues</h4>
                    <p className="text-yellow-800">If files aren't uploading, check that they're valid SQL files and under 10MB each. For larger files, consider splitting them into smaller chunks.</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Conversion Accuracy</h4>
                    <p className="text-green-800">While our AI provides high accuracy, always review converted code before deploying to production. Test thoroughly in a development environment first.</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Performance Optimization</h4>
                    <p className="text-blue-800">The platform provides performance analysis and recommendations. Consider implementing suggested optimizations for better Oracle performance.</p>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Need More Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you need additional assistance or have specific questions about your migration, our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Migrate Your Sybase Database to Oracle with{' '}
              <span className="text-primary">AI-Powered Precision</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your legacy Sybase applications to modern Oracle infrastructure 
              with intelligent code conversion, automated testing, and seamless deployment.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="text-lg px-8 py-4"
              >
                Start Migration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Migration Platform?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Leverage cutting-edge AI technology to ensure accurate, efficient, and reliable database migration
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary" />
                  <CardTitle>AI-Powered Conversion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced AI models automatically convert Sybase SQL to Oracle PL/SQL 
                  with high accuracy and intelligent error detection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle>Comprehensive Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Detailed reports on data type mappings, performance improvements, 
                  and potential issues with suggested fixes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle>Secure & Reliable</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Enterprise-grade security with user isolation, encrypted data handling, 
                  and comprehensive audit trails.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <CardTitle>Faster Migration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Reduce migration time from months to weeks with automated conversion 
                  and intelligent code optimization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle>Team Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Multi-user support with project sharing, version control, 
                  and collaborative review processes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-primary" />
                  <CardTitle>Direct Deployment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Seamless deployment to Oracle databases with automated testing 
                  and rollback capabilities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Database?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers who have successfully migrated to Oracle
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4"
          >
            Start Your Migration Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Database className="h-6 w-6" />
            <span className="text-lg font-semibold">Sybase to Oracle Migration</span>
          </div>
          <p className="text-gray-400">
            © 2024 Migration Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
