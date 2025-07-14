import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, onSuccess?: () => void) => Promise<{ error: any }>;
  signIn: (email: string, password: string, onSuccess?: () => void) => Promise<{ error: any }>;
  signOut: (onSuccess?: () => void) => Promise<void>;
}

// Auth context and provider for Supabase authentication
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a unique username from email (ensures no collisions)
const generateUsername = async (email: string) => {
  let base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  let username = base;
  let suffix = 1;
  // Try incrementing until we find a unique username
  while (true) {
    const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
    if (!data) break;
    username = `${base}${suffix}`;
    suffix++;
  }
  return username;
};

// Provider for authentication state and actions
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's profile from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error) setProfile(profileData);
      else setProfile(null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Get the initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up a new user and create a profile
  const signUp = async (email: string, password: string, fullName: string, onSuccess?: () => void) => {
    const redirectUrl = `${window.location.origin}/`;
    const username = await generateUsername(email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, username }
      }
    });
    if (!error) {
      if (onSuccess) onSuccess();
      // Fetch profile in background
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) fetchProfile(data.user.id);
      });
    }
    return { error };
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string, onSuccess?: () => void) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      if (onSuccess) onSuccess();
      // Fetch profile in background
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) fetchProfile(data.user.id);
      });
    }
    return { error };
  };

  // Sign out the user and clear profile
  const signOut = async (onSuccess?: () => void) => {
    await supabase.auth.signOut();
    setProfile(null);
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context (must be used inside AuthProvider)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility to backfill usernames for existing profiles (one-off migration)
export const backfillUsernames = async () => {
  const { data: profiles } = await supabase.from('profiles').select('*');
  for (const profile of profiles) {
    if (!profile.username) {
      const username = await generateUsername(profile.email);
      await supabase.from('profiles').update({ username }).eq('id', profile.id);
    }
  }
};