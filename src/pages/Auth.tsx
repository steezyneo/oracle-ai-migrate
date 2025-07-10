import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const PORTAL_EASTER_EGG = 'open sesame';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    fullName: '', 
    email: '', 
    password: '' 
  });
  const [portalActive, setPortalActive] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Teleportation animation
      setPortalActive(true);
      setTimeout(() => navigate('/migration'), 1200);
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.password === PORTAL_EASTER_EGG) {
      setEasterEgg(true);
      setTimeout(() => setEasterEgg(false), 3000);
      return;
    }
    setIsLoading(true);
    setPortalActive(true);
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setPortalActive(false);
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
    if (signupData.password === PORTAL_EASTER_EGG) {
      setEasterEgg(true);
      setTimeout(() => setEasterEgg(false), 3000);
      return;
    }
    setIsLoading(true);
    setPortalActive(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
      setPortalActive(false);
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
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
  };

  // Floating input animation
  const [focusField, setFocusField] = useState<string | null>(null);
  const floatingStyle = (field: string) =>
    focusField === field
      ? { transform: 'none', zIndex: 2 }
      : field === 'email'
      ? { transform: 'translate(-60px, -40px) scale(0.95) rotate(-8deg)', zIndex: 1 }
      : field === 'password'
      ? { transform: 'translate(60px, -40px) scale(0.95) rotate(8deg)', zIndex: 1 }
      : field === 'fullName'
      ? { transform: 'translate(0, 60px) scale(0.95) rotate(0deg)', zIndex: 1 }
      : {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] relative overflow-hidden">
      {/* Portal Animation */}
      <style>{`
        .portal-ring {
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, #00ffe7 0%, #0f2027 80%);
          box-shadow: 0 0 80px 10px #00ffe7, 0 0 0 8px #232526 inset;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          animation: portal-pulse 2s infinite alternate;
        }
        @keyframes portal-pulse {
          0% { box-shadow: 0 0 80px 10px #00ffe7, 0 0 0 8px #232526 inset; }
          100% { box-shadow: 0 0 120px 30px #00ffe7, 0 0 0 16px #232526 inset; }
        }
        .portal-burst {
          animation: portal-burst 0.7s cubic-bezier(.4,2,.6,.9);
        }
        @keyframes portal-burst {
          0% { box-shadow: 0 0 80px 10px #00ffe7, 0 0 0 8px #232526 inset; }
          60% { box-shadow: 0 0 200px 80px #00ffe7, 0 0 0 32px #232526 inset; }
          100% { box-shadow: 0 0 80px 10px #00ffe7, 0 0 0 8px #232526 inset; }
        }
        .glass-card {
          background: rgba(20, 30, 40, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          border: 1.5px solid rgba(255,255,255,0.12);
        }
        .neon-btn {
          background: linear-gradient(90deg, #00ffe7 0%, #00bfff 100%);
          color: #232526;
          box-shadow: 0 0 12px #00ffe7;
          border: none;
          transition: box-shadow 0.2s;
        }
        .neon-btn:hover {
          box-shadow: 0 0 32px #00ffe7;
        }
        .easter-egg {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          color: #fffbe7;
          font-size: 2rem;
          text-shadow: 0 0 24px #ffe700, 0 0 48px #00ffe7;
          animation: egg-float 2s infinite alternate;
        }
        @keyframes egg-float {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -54%) scale(1.08); }
        }
      `}</style>
      <div
        ref={portalRef}
        className={`portal-ring ${portalActive ? 'portal-burst' : ''}`}
        style={{ transition: 'box-shadow 0.7s' }}
      />
      {easterEgg && (
        <div className="easter-egg flex flex-col items-center">
          <Sparkles className="h-12 w-12 mb-2 animate-pulse" />
          <span>✨ Secret Portal Activated! ✨</span>
        </div>
      )}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-[#00ffe7] mr-3 drop-shadow-lg" />
            <h1 className="text-3xl font-extrabold text-white tracking-widest drop-shadow-lg">PORTAL LOGIN</h1>
          </div>
          <p className="text-[#b2fefa] text-lg font-medium drop-shadow">Enter the portal to migrate your world</p>
        </div>
        <Card className="glass-card text-white">
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
                <form onSubmit={handleLogin} className="space-y-8 relative">
                  <div className="space-y-2" style={floatingStyle('email')}>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onFocus={() => setFocusField('email')}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative" style={floatingStyle('password')}>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type={loginPasswordVisible ? 'text' : 'password'}
                      value={loginData.password}
                      onFocus={() => setFocusField('password')}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-8 text-[#00ffe7]"
                      tabIndex={-1}
                      onClick={() => setLoginPasswordVisible(v => !v)}
                    >
                      {loginPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end mb-2">
                    <Button type="button" variant="link" className="p-0 text-sm text-[#00ffe7]" onClick={handleForgotPassword} disabled={resetLoading}>
                      Forgot Password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full neon-btn" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enter Portal
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-8 relative">
                  <div className="space-y-2" style={floatingStyle('fullName')}>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onFocus={() => setFocusField('fullName')}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2" style={floatingStyle('email')}>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onFocus={() => setFocusField('email')}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative" style={floatingStyle('password')}>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type={signupPasswordVisible ? 'text' : 'password'}
                      value={signupData.password}
                      onFocus={() => setFocusField('password')}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-8 text-[#00ffe7]"
                      tabIndex={-1}
                      onClick={() => setSignupPasswordVisible(v => !v)}
                    >
                      {signupPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full neon-btn" disabled={isLoading}>
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
            className="text-[#00ffe7]"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
