-- Create file_comments table for storing user comments on files
CREATE TABLE public.file_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT NOT NULL CHECK (tag IN ('Issue', 'Suggestion', 'Question', 'Resolved', 'Note', 'Todo', 'Praise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own file comments" 
ON public.file_comments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file comments" 
ON public.file_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file comments" 
ON public.file_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file comments" 
ON public.file_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for automatic updates
ALTER TABLE public.file_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_comments; 