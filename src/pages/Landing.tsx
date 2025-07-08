import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Zap, Shield, Clock, Users, ArrowRight, History, HelpCircle, Sun, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Help from '@/components/Help';

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  // Remove all theme/dark/system mode logic and UI

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Sybase to Oracle Migration</h1>
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
                  <Button onClick={async () => { await signOut(); navigate('/'); }}>
                    Sign Out
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
      {showHelp && <Help onClose={() => setShowHelp(false)} />}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Migrate Your Sybase Database to Oracle with{' '}
              <span className="text-primary">AI-Powered Precision</span>
            </h2>
            <p className="text-xl text-foreground mb-8 leading-relaxed">
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
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Our Migration Platform?
            </h3>
            <p className="text-lg text-foreground max-w-2xl mx-auto">
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
