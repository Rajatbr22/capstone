-- This SQL file contains the complete database schema for the application
-- It can be run in the Supabase SQL Editor to set up all necessary tables

-- Profiles table - Stores user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  mfa_enabled BOOLEAN DEFAULT true, -- Default MFA to true for all users
  last_login TIMESTAMP WITH TIME ZONE,
  risk_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

-- Create non-recursive RLS policies for profiles 
-- Users can view their own profile using direct auth.uid() check
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admin policy using a simpler approach to avoid recursion
-- This policy directly checks if the current user's id is in the admin_ids table
CREATE TABLE IF NOT EXISTS admin_ids (
  id UUID PRIMARY KEY REFERENCES auth.users(id)
);

-- Create a policy for admins using the admin_ids table
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

-- Create an insert policy without circular references
CREATE POLICY "Anyone can create profiles" 
ON profiles FOR INSERT 
WITH CHECK (true);

-- Files table - Stores file metadata
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_level TEXT[] DEFAULT ARRAY['admin', 'user']::TEXT[],
  threat_score FLOAT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  content_analysis JSONB
);

-- Enable Row Level Security for files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view files based on access_level" ON files;
DROP POLICY IF EXISTS "Users can insert their own files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;
DROP POLICY IF EXISTS "Admins can do anything with files" ON files;

-- Create RLS policies for files without circular dependencies
CREATE POLICY "Users can view files based on access_level" 
ON files FOR SELECT 
USING (
  -- Files uploaded by the user
  uploaded_by = auth.uid() OR
  -- Files accessible to all users with role 'user'
  'user' = ANY(files.access_level) OR
  -- Files accessible to admins
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own files" 
ON files FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own files" 
ON files FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own files" 
ON files FOR DELETE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can do anything with files" 
ON files 
USING (
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

-- Activities table - Logs user activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  risk_level TEXT DEFAULT 'low',
  details JSONB
);

-- Enable Row Level Security for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" 
ON activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" 
ON activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

CREATE POLICY "System can insert activities" 
ON activities FOR INSERT 
WITH CHECK (true);

-- Notifications table - Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_url TEXT
);

-- Enable Row Level Security for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- MFA table - Stores Multi-Factor Authentication information
CREATE TABLE IF NOT EXISTS mfa_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for mfa_verifications
ALTER TABLE mfa_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mfa_verifications
CREATE POLICY "Users can view their own MFA verifications" 
ON mfa_verifications FOR SELECT 
USING (auth.uid() = user_id);

-- Settings table - Stores application settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for settings
CREATE POLICY "Anyone can view public settings" 
ON settings FOR SELECT 
USING (id LIKE 'public.%');

CREATE POLICY "Users can view their own settings" 
ON settings FOR SELECT 
USING (id LIKE 'user.' || auth.uid() || '.%');

CREATE POLICY "Admins can view and modify all settings" 
ON settings 
USING (
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
);

-- Storage bucket RLS policies
-- Need to be run in SQL Editor to set up storage permissions

-- Create a storage bucket for files if it doesn't exist
-- This needs to be done in the Supabase Dashboard or via the API

-- Storage RLS policies - Need to be executed after creating the bucket
comment on storage.buckets is 'Define storage bucket RLS policies with the following SQL:

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
USING (
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
USING (
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow users to read files they have access to
CREATE POLICY "Users can read files they have access to" 
ON storage.objects FOR SELECT 
USING (
  -- Users can access their own files
  (storage.foldername(name))[1] = auth.uid()::TEXT
  OR
  -- Admins can access all files
  EXISTS (
    SELECT 1 FROM admin_ids WHERE admin_ids.id = auth.uid()
  )
  OR
  -- Files in the public folder are accessible to all authenticated users
  (storage.foldername(name))[1] = \'public\'
);';

-- Insert default settings
INSERT INTO settings (id, value, description)
VALUES 
  ('public.security.max_login_attempts', '5'::jsonb, 'Maximum number of login attempts before lockout'),
  ('public.security.lockout_duration_minutes', '30'::jsonb, 'Duration of account lockout in minutes'),
  ('public.security.mfa_required_roles', '["admin", "manager", "user"]'::jsonb, 'Roles that require MFA'); -- All roles require MFA

-- Trigger to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is intended to be an admin
  DECLARE
    is_admin BOOLEAN;
  BEGIN
    is_admin := (NEW.raw_user_meta_data->>'is_admin')::boolean = true OR 
                LOWER(COALESCE(NEW.raw_user_meta_data->>'username', '')) = 'admin' OR
                LOWER(NEW.email) LIKE '%admin%';
  END;
  
  INSERT INTO public.profiles (id, username, email, role, mfa_enabled)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email), 
    NEW.email, 
    CASE 
      WHEN is_admin THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE id != NEW.id) THEN 'user'
      ELSE 'admin' -- First user is admin
    END,
    true -- MFA enabled by default for all users
  );
  
  -- If this is the first user or explicitly marked as admin in metadata, add to admin_ids
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id != NEW.id) OR is_admin THEN
    INSERT INTO admin_ids (id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle file uploads
CREATE OR REPLACE FUNCTION public.handle_storage_object_insert() 
RETURNS TRIGGER AS $$
DECLARE
  file_id TEXT;
  file_name TEXT;
  file_size INT;
  file_type TEXT;
  file_path TEXT;
  user_id UUID;
BEGIN
  -- Generate a file ID
  file_id := 'file-' || gen_random_uuid()::TEXT;
  
  -- Extract file information
  file_name := storage.filename(NEW.name);
  file_size := NEW.metadata->>'size';
  file_type := NEW.metadata->>'mimetype';
  file_path := storage.foldername(NEW.name);
  
  -- Get user ID from the path
  user_id := (file_path[1])::UUID;
  
  -- Insert file metadata into the files table
  INSERT INTO public.files (
    id, 
    name, 
    type, 
    size, 
    path, 
    uploaded_by, 
    uploaded_at
  )
  VALUES (
    file_id,
    file_name,
    file_type,
    file_size::INT,
    NEW.name,
    user_id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for file uploads - Uncomment after creating the files bucket
-- DROP TRIGGER IF EXISTS on_storage_object_insert ON storage.objects;
-- CREATE TRIGGER on_storage_object_insert
--   AFTER INSERT ON storage.objects
--   FOR EACH ROW EXECUTE FUNCTION public.handle_storage_object_insert();
