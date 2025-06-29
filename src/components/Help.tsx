
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  FileText,
  Database,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HelpProps {
  onClose: () => void;
}

const Help: React.FC<HelpProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      id: 'upload',
      question: 'What file formats are supported for upload?',
      answer: 'We support .sql, .txt, .tab, .prc, .trg files and more. You can upload individual files or entire folders containing your Sybase database objects.',
      category: 'Upload'
    },
    {
      id: 'conversion',
      question: 'How accurate is the AI conversion?',
      answer: 'Our AI conversion engine has high accuracy for standard Sybase to Oracle migrations. It handles data type mappings, syntax differences, and common patterns. Complex custom logic may require manual review.',
      category: 'Conversion'
    },
    {
      id: 'data-types',
      question: 'How are Sybase data types mapped to Oracle?',
      answer: 'We provide comprehensive data type mapping (e.g., INT → NUMBER(10), VARCHAR → VARCHAR2, TEXT → CLOB). Check the Data Type Mapping tab in the upload section for complete details.',
      category: 'Data Types'
    },
    {
      id: 'issues',
      question: 'What should I do if the conversion has issues?',
      answer: 'Use the "Fix with AI" button to automatically resolve common issues. For complex problems, you can manually edit the converted code or contact support for assistance.',
      category: 'Issues'
    },
    {
      id: 'deployment',
      question: 'Can I deploy directly to Oracle database?',
      answer: 'Yes, you can configure database connections and deploy converted objects directly. We also provide download options for manual deployment.',
      category: 'Deployment'
    },
    {
      id: 'history',
      question: 'Can I access my previous migrations?',
      answer: 'Yes, all your migration projects and deployment logs are saved in the History section. You can review past conversions and their results.',
      category: 'History'
    },
    {
      id: 'collaboration',
      question: 'Can multiple users work on the same migration project?',
      answer: 'Currently, each user has their own isolated workspace. We\'re working on team collaboration features for future releases.',
      category: 'Collaboration'
    },
    {
      id: 'pricing',
      question: 'What are the usage limits?',
      answer: 'Usage limits depend on your plan. Free tier includes basic conversions, while premium plans offer unlimited conversions and advanced features.',
      category: 'Pricing'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', contactForm);
    
    toast({
      title: 'Message Sent',
      description: 'Thank you for contacting us. We\'ll get back to you soon!',
    });
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const getFaqsByCategory = (category: string) => {
    return faqs.filter(faq => faq.category === category);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Help & Support</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="contact">Contact Us</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faq" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                
                {['Upload', 'Conversion', 'Data Types', 'Issues', 'Deployment', 'History'].map(category => (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                      {category === 'Upload' && <FileText className="h-4 w-4" />}
                      {category === 'Conversion' && <Zap className="h-4 w-4" />}
                      {category === 'Data Types' && <Database className="h-4 w-4" />}
                      {category === 'Issues' && <HelpCircle className="h-4 w-4" />}
                      {category === 'Deployment' && <ExternalLink className="h-4 w-4" />}
                      {category === 'History' && <FileText className="h-4 w-4" />}
                      {category}
                    </h4>
                    
                    <div className="space-y-2">
                      {getFaqsByCategory(category).map((faq) => (
                        <Card key={faq.id} className="border">
                          <CardHeader 
                            className="cursor-pointer p-4 hover:bg-gray-50"
                            onClick={() => toggleFaq(faq.id)}
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm">{faq.question}</h5>
                              {expandedFaq === faq.id ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </div>
                          </CardHeader>
                          {expandedFaq === faq.id && (
                            <CardContent className="p-4 pt-0">
                              <p className="text-gray-600 text-sm">{faq.answer}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Send us a Message
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            rows={4}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Email Support</p>
                          <p className="text-sm text-gray-600">support@migration-platform.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Phone Support</p>
                          <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Live Chat</p>
                          <p className="text-sm text-gray-600">Available 9 AM - 6 PM EST</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Helpful Resources</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Migration Guide</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Step-by-step guide for migrating from Sybase to Oracle
                      </p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Guide
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Video Tutorials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Watch video tutorials on using the migration platform
                      </p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch Videos
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">API Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Technical documentation for API integration
                      </p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Docs
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Learn best practices for database migration
                      </p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Help;
