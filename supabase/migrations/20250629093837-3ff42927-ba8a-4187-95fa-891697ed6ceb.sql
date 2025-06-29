
-- Add columns to migration_files to store detailed conversion data
ALTER TABLE migration_files 
ADD COLUMN IF NOT EXISTS data_type_mapping jsonb,
ADD COLUMN IF NOT EXISTS issues jsonb,
ADD COLUMN IF NOT EXISTS performance_metrics jsonb,
ADD COLUMN IF NOT EXISTS syntax_differences jsonb;

-- Create a table to store migration reports
CREATE TABLE IF NOT EXISTS migration_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_id uuid NOT NULL,
  report_content text NOT NULL,
  efficiency_metrics jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for migration_reports
ALTER TABLE migration_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own migration reports" 
  ON migration_reports 
  FOR SELECT 
  USING (
    migration_id IN (
      SELECT id FROM migrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own migration reports" 
  ON migration_reports 
  FOR INSERT 
  WITH CHECK (
    migration_id IN (
      SELECT id FROM migrations WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for migration_files if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migration_files' 
    AND policyname = 'Users can view their own migration files'
  ) THEN
    CREATE POLICY "Users can view their own migration files" 
      ON migration_files 
      FOR SELECT 
      USING (
        migration_id IN (
          SELECT id FROM migrations WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migration_files' 
    AND policyname = 'Users can create their own migration files'
  ) THEN
    CREATE POLICY "Users can create their own migration files" 
      ON migration_files 
      FOR INSERT 
      WITH CHECK (
        migration_id IN (
          SELECT id FROM migrations WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migration_files' 
    AND policyname = 'Users can update their own migration files'
  ) THEN
    CREATE POLICY "Users can update their own migration files" 
      ON migration_files 
      FOR UPDATE 
      USING (
        migration_id IN (
          SELECT id FROM migrations WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add RLS policies for migrations if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migrations' 
    AND policyname = 'Users can view their own migrations'
  ) THEN
    CREATE POLICY "Users can view their own migrations" 
      ON migrations 
      FOR SELECT 
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migrations' 
    AND policyname = 'Users can create their own migrations'
  ) THEN
    CREATE POLICY "Users can create their own migrations" 
      ON migrations 
      FOR INSERT 
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'migrations' 
    AND policyname = 'Users can update their own migrations'
  ) THEN
    CREATE POLICY "Users can update their own migrations" 
      ON migrations 
      FOR UPDATE 
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Add RLS policy for deployment_logs to isolate by user
ALTER TABLE deployment_logs 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users,
ADD COLUMN IF NOT EXISTS migration_id uuid;

-- Enable RLS on deployment_logs
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deployment_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deployment_logs' 
    AND policyname = 'Users can view their own deployment logs'
  ) THEN
    CREATE POLICY "Users can view their own deployment logs" 
      ON deployment_logs 
      FOR SELECT 
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deployment_logs' 
    AND policyname = 'Users can create their own deployment logs'
  ) THEN
    CREATE POLICY "Users can create their own deployment logs" 
      ON deployment_logs 
      FOR INSERT 
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
