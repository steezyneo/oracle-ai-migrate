import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    fullName: '', 
    email: '', 
    password: '' 
  });
  
  const { signIn, signUp, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/migration');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    
    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
<<<<<<< HEAD
    setResetLoading(true);
    if (!loginData.email) {
      toast({
        title: 'Enter Email',
        description: 'Please enter your email to reset your password.',
        variant: 'destructive',
      });
      setResetLoading(false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
      redirectTo: window.location.origin + '/auth',
    });
    if (error) {
      toast({
        title: 'Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for a password reset link.',
      });
    }
    setResetLoading(false);
=======
    if (!loginData.email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await resetPassword(loginData.email);
      if (error) {
        toast({
          title: 'Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Email Sent',
          description: 'Check your email for a password reset link.',
        });
      }
    } catch (err) {
      toast({
        title: 'Reset Failed',
        description: 'An error occurred while sending the reset email.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-foreground">Migration Tool</h1>
          </div>
          <p className="text-foreground">Sign in to start your Sybase to Oracle migration</p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="login-password">Password</Label>
<<<<<<< HEAD
                    <Input
                      id="login-password"
                      type={loginPasswordVisible ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-8 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setLoginPasswordVisible(v => !v)}
                    >
                      {loginPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end mb-2">
                    <Button type="button" variant="link" className="p-0 text-sm" onClick={handleForgotPassword} disabled={resetLoading}>
=======
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="link" className="px-0" onClick={handleForgotPassword}>
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
                      Forgot Password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-password">Password</Label>
<<<<<<< HEAD
                    <Input
                      id="signup-password"
                      type={signupPasswordVisible ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-8 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setSignupPasswordVisible(v => !v)}
                    >
                      {signupPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
=======
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
