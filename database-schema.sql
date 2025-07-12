-- =====================================================
-- Sybase to Oracle Migration Tool - Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MIGRATIONS TABLE
-- =====================================================
CREATE TABLE public.migrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  folder_structure JSONB,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MIGRATION FILES TABLE
-- =====================================================
CREATE TABLE public.migration_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_id UUID NOT NULL REFERENCES public.migrations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('table', 'procedure', 'trigger', 'other')),
  original_content TEXT,
  converted_content TEXT,
  conversion_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'success', 'failed', 'deployed')),
  error_message TEXT,
  deployment_timestamp TIMESTAMP WITH TIME ZONE,
  data_type_mapping JSONB,
  performance_metrics JSONB,
  issues JSONB,
  syntax_differences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique file per migration
  CONSTRAINT migration_files_unique_file_per_migration UNIQUE (migration_id, file_name)
);

-- =====================================================
-- DEPLOYMENT LOGS TABLE
-- =====================================================
CREATE TABLE public.deployment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_id UUID REFERENCES public.migrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Success', 'Failed')),
  lines_of_sql INTEGER NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  deployment_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MIGRATION REPORTS TABLE
-- =====================================================
CREATE TABLE public.migration_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_id UUID NOT NULL REFERENCES public.migrations(id) ON DELETE CASCADE,
  report_content TEXT NOT NULL,
  efficiency_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- UNREVIEWED FILES TABLE
-- =====================================================
CREATE TABLE public.unreviewed_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  converted_code TEXT NOT NULL,
  original_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'reviewed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Migrations indexes
CREATE INDEX idx_migrations_user_id ON public.migrations(user_id);
CREATE INDEX idx_migrations_created_at ON public.migrations(created_at DESC);
CREATE INDEX idx_migrations_status ON public.migrations(status);

-- Migration files indexes
CREATE INDEX idx_migration_files_migration_id ON public.migration_files(migration_id);
CREATE INDEX idx_migration_files_conversion_status ON public.migration_files(conversion_status);
CREATE INDEX idx_migration_files_file_type ON public.migration_files(file_type);
CREATE INDEX idx_migration_files_created_at ON public.migration_files(created_at DESC);

-- Deployment logs indexes
CREATE INDEX idx_deployment_logs_user_id ON public.deployment_logs(user_id);
CREATE INDEX idx_deployment_logs_migration_id ON public.deployment_logs(migration_id);
CREATE INDEX idx_deployment_logs_created_at ON public.deployment_logs(created_at DESC);
CREATE INDEX idx_deployment_logs_status ON public.deployment_logs(status);

-- Migration reports indexes
CREATE INDEX idx_migration_reports_migration_id ON public.migration_reports(migration_id);
CREATE INDEX idx_migration_reports_created_at ON public.migration_reports(created_at DESC);

-- Unreviewed files indexes
CREATE INDEX idx_unreviewed_files_user_id ON public.unreviewed_files(user_id);
CREATE INDEX idx_unreviewed_files_status ON public.unreviewed_files(status);
CREATE INDEX idx_unreviewed_files_created_at ON public.unreviewed_files(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unreviewed_files ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Migrations policies
CREATE POLICY "Users can view their own migrations" 
  ON public.migrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own migrations" 
  ON public.migrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own migrations" 
  ON public.migrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own migrations" 
  ON public.migrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Migration files policies
CREATE POLICY "Users can view their own migration files" 
  ON public.migration_files 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can create their own migration files" 
  ON public.migration_files 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can update their own migration files" 
  ON public.migration_files 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can delete their own migration files" 
  ON public.migration_files 
  FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

-- Deployment logs policies
CREATE POLICY "Users can view their own deployment logs" 
  ON public.deployment_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deployment logs" 
  ON public.deployment_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployment logs" 
  ON public.deployment_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Migration reports policies
CREATE POLICY "Users can view their own migration reports" 
  ON public.migration_reports 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can create their own migration reports" 
  ON public.migration_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can delete their own migration reports" 
  ON public.migration_reports 
  FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

-- Unreviewed files policies
CREATE POLICY "Users can view their own unreviewed files" 
  ON public.unreviewed_files 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unreviewed files" 
  ON public.unreviewed_files 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unreviewed files" 
  ON public.unreviewed_files 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unreviewed files" 
  ON public.unreviewed_files 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_migrations_updated_at
  BEFORE UPDATE ON public.migrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_migration_files_updated_at
  BEFORE UPDATE ON public.migration_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unreviewed_files_updated_at
  BEFORE UPDATE ON public.unreviewed_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- REALTIME ENABLING
-- =====================================================

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.migrations REPLICA IDENTITY FULL;
ALTER TABLE public.migration_files REPLICA IDENTITY FULL;
ALTER TABLE public.deployment_logs REPLICA IDENTITY FULL;
ALTER TABLE public.migration_reports REPLICA IDENTITY FULL;
ALTER TABLE public.unreviewed_files REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.migrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.migration_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.migration_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unreviewed_files;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get migration statistics
CREATE OR REPLACE FUNCTION get_migration_stats(migration_uuid UUID)
RETURNS TABLE(
  total_files INTEGER,
  success_files INTEGER,
  failed_files INTEGER,
  pending_files INTEGER,
  deployed_files INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_files,
    COUNT(*) FILTER (WHERE conversion_status = 'success')::INTEGER as success_files,
    COUNT(*) FILTER (WHERE conversion_status = 'failed')::INTEGER as failed_files,
    COUNT(*) FILTER (WHERE conversion_status = 'pending')::INTEGER as pending_files,
    COUNT(*) FILTER (WHERE conversion_status = 'deployed')::INTEGER as deployed_files
  FROM public.migration_files
  WHERE migration_id = migration_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user migration summary
CREATE OR REPLACE FUNCTION get_user_migration_summary(user_uuid UUID)
RETURNS TABLE(
  total_migrations INTEGER,
  total_files INTEGER,
  success_files INTEGER,
  failed_files INTEGER,
  pending_files INTEGER,
  deployed_files INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT m.id)::INTEGER as total_migrations,
    COUNT(mf.id)::INTEGER as total_files,
    COUNT(mf.id) FILTER (WHERE mf.conversion_status = 'success')::INTEGER as success_files,
    COUNT(mf.id) FILTER (WHERE mf.conversion_status = 'failed')::INTEGER as failed_files,
    COUNT(mf.id) FILTER (WHERE mf.conversion_status = 'pending')::INTEGER as pending_files,
    COUNT(mf.id) FILTER (WHERE mf.conversion_status = 'deployed')::INTEGER as deployed_files
  FROM public.migrations m
  LEFT JOIN public.migration_files mf ON m.id = mf.migration_id
  WHERE m.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.migrations IS 'Migration projects created by users';
COMMENT ON TABLE public.migration_files IS 'Individual files within migration projects';
COMMENT ON TABLE public.deployment_logs IS 'Logs of Oracle deployment attempts';
COMMENT ON TABLE public.migration_reports IS 'Generated reports for migration projects';
COMMENT ON TABLE public.unreviewed_files IS 'Files pending user review after conversion';

COMMENT ON COLUMN public.migrations.folder_structure IS 'JSON representation of uploaded folder structure';
COMMENT ON COLUMN public.migration_files.data_type_mapping IS 'Mapping of Sybase to Oracle data types';
COMMENT ON COLUMN public.migration_files.performance_metrics IS 'Performance analysis of converted code';
COMMENT ON COLUMN public.migration_files.issues IS 'Issues found during conversion';
COMMENT ON COLUMN public.migration_files.syntax_differences IS 'Syntax differences between Sybase and Oracle';
COMMENT ON COLUMN public.deployment_logs.deployment_config IS 'Configuration used for Oracle deployment'; 