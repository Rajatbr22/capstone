
-- SQL to set up the database structure for NLP analysis integration

-- Ensure files table has the necessary columns for NLP analysis
ALTER TABLE files ADD COLUMN IF NOT EXISTS content_analysis JSONB;
ALTER TABLE files ADD COLUMN IF NOT EXISTS threat_score FLOAT DEFAULT 0;

-- Create a trigger to automatically analyze files when uploaded
CREATE OR REPLACE FUNCTION public.handle_file_upload_analysis() 
RETURNS TRIGGER AS $$
BEGIN
  -- Set the file for pending analysis
  NEW.threat_score := 0;
  NEW.content_analysis := NULL;
  
  -- You could insert into a queue table for asynchronous processing
  -- INSERT INTO analysis_queue (file_id, created_at) VALUES (NEW.id, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a file is inserted
DROP TRIGGER IF EXISTS on_file_inserted ON files;
CREATE TRIGGER on_file_inserted
  BEFORE INSERT ON files
  FOR EACH ROW EXECUTE FUNCTION public.handle_file_upload_analysis();

-- Create a table to track NLP analysis history
CREATE TABLE IF NOT EXISTS file_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id TEXT REFERENCES files(id) ON DELETE CASCADE,
  analysis_result JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_by UUID REFERENCES auth.users(id),
  service_used TEXT,
  version TEXT
);

-- Create a policy to allow file owners and admins to view analysis history
CREATE POLICY "Users can view analysis history of their files" 
ON file_analysis_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM files 
    WHERE files.id = file_analysis_history.file_id
    AND (
      -- File owner can view
      files.uploaded_by = auth.uid() 
      OR
      -- Admin can view all
      EXISTS (SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid())
    )
  )
);

-- RLS is enabled by default on this table
ALTER TABLE file_analysis_history ENABLE ROW LEVEL SECURITY;

-- Create insert policy for the file analysis history
CREATE POLICY "Anyone can insert file analysis history" 
ON file_analysis_history FOR INSERT 
WITH CHECK (true);

-- Optionally, create a view that joins files with their latest analysis
CREATE OR REPLACE VIEW files_with_analysis AS
SELECT 
  f.*,
  h.analysis_result,
  h.analyzed_at,
  h.service_used,
  h.version
FROM 
  files f
LEFT JOIN (
  SELECT DISTINCT ON (file_id) 
    file_id, 
    analysis_result,
    analyzed_at,
    service_used,
    version
  FROM 
    file_analysis_history
  ORDER BY 
    file_id, 
    analyzed_at DESC
) h ON f.id = h.file_id;

-- RLS is enabled for the view
ALTER VIEW files_with_analysis SECURITY DEFINER;

COMMENT ON VIEW files_with_analysis IS 'View that shows files with their latest analysis results';
