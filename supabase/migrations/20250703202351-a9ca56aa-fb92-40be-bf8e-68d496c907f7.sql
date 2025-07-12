-- Create unreviewed_files table for tracking files that need user review
CREATE TABLE public.unreviewed_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  converted_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'reviewed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create databases table to track multiple databases per migration
CREATE TABLE public.migration_databases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_id UUID NOT NULL REFERENCES public.migrations(id) ON DELETE CASCADE,
  database_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(migration_id, database_name)
);

-- Add database_name field to migration_files table
ALTER TABLE public.migration_files 
ADD COLUMN database_name TEXT NOT NULL DEFAULT 'default';

-- Create index for better performance
CREATE INDEX idx_migration_files_database ON public.migration_files(migration_id, database_name);

-- Enable Row Level Security
ALTER TABLE public.unreviewed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_databases ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
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

-- Create policies for migration_databases
CREATE POLICY "Users can view their own migration databases" 
ON public.migration_databases 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can create their own migration databases" 
ON public.migration_databases 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can update their own migration databases" 
ON public.migration_databases 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

CREATE POLICY "Users can delete their own migration databases" 
ON public.migration_databases 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM public.migrations WHERE id = migration_id));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_unreviewed_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_unreviewed_files_updated_at
  BEFORE UPDATE ON public.unreviewed_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unreviewed_files_updated_at();

-- Enable realtime for new tables
ALTER TABLE public.migration_databases REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.migration_databases;