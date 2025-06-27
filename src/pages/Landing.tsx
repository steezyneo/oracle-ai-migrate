
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Code, FileCheck, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleStartMigration = () => {
    navigate('/migration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <Database className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Sybase to Oracle Migration Tool</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Effortless Sybase to Oracle Migration
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Leverage the power of Google's Gemini API to automate your entire migration process, 
            from schema translation to final reporting.
          </p>
          
          {/* Hero Visual */}
          <div className="flex justify-center items-center mb-16">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Database className="h-10 w-10 text-orange-600" />
                </div>
                <p className="font-semibold text-gray-700">Sybase</p>
              </div>
              
              <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
              
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <p className="font-semibold text-gray-700">AI Migration</p>
              </div>
              
              <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
              
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Database className="h-10 w-10 text-red-600" />
                </div>
                <p className="font-semibold text-gray-700">Oracle</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Seamless Migration
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI-Powered Code Translation */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Code className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  AI-Powered Code Translation
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our tool uses a fine-tuned Gemini API to intelligently convert Sybase-specific 
                  functions, security policies (RLS), and business logic into Oracle-native code 
                  with precision and accuracy.
                </p>
              </CardContent>
            </Card>

            {/* Migration Process */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  The Migration Process
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-gray-600"><strong>Connect:</strong> Securely link your Supabase and Oracle instances</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-gray-600"><strong>Migrate:</strong> Automatic schema mapping, data transfer, and logic conversion</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-gray-600"><strong>Validate:</strong> The process finishes with comprehensive validation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Report Generation */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Detailed Report Generation
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  After migration, receive a comprehensive report detailing schema changes, 
                  data validation checksums, and performance benchmarks to ensure a successful 
                  transition.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Begin?</h2>
            <p className="text-xl text-blue-100 mb-10">
              Transform your database infrastructure with confidence. 
              Start your automated migration journey today.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 text-lg px-12 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
              onClick={handleStartMigration}
            >
              <Database className="h-6 w-6 mr-3" />
              Start Your Migration
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Sybase to Oracle Migration Tool - Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
