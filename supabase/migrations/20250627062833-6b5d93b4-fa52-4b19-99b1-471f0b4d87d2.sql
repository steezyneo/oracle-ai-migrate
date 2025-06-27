
-- Create a table for deployment logs
CREATE TABLE public.deployment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('Success', 'Failed')),
  lines_of_sql INTEGER NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Add Row Level Security (RLS) - making it public for now since no authentication is implemented
ALTER TABLE public.deployment_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to view deployment logs (public access)
CREATE POLICY "Anyone can view deployment logs" 
  ON public.deployment_logs 
  FOR SELECT 
  USING (true);

-- Create policy that allows anyone to insert deployment logs (public access)
CREATE POLICY "Anyone can create deployment logs" 
  ON public.deployment_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime for automatic updates
ALTER TABLE public.deployment_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_logs;
