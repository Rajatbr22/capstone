
# Supabase Setup Guide

To properly set up Supabase for this application, follow these steps:

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Name your project and set a secure database password
3. Choose a region close to your users

## 2. Set Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Make sure to restart your development server after creating or modifying the `.env` file.

## 3. Run Database Schema Setup

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `src/lib/supabase-schema.sql` and paste it into the SQL Editor
3. Run the SQL script to create all tables and set up RLS policies

**Note**: If you see a "recursive policy" error, it means there's an infinite recursion in the policy definitions. The latest schema in this project should fix this issue, so make sure you're using the most recent version.

## 4. Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket called "files"
3. Set the bucket permissions according to your needs
4. Run the commented-out SQL in the schema file for storage RLS

## 5. Configure Google OAuth

1. Go to Authentication > Providers in Supabase dashboard
2. Enable Google OAuth
3. Follow the instructions to set up OAuth credentials in Google Cloud Console
4. Add authorized redirect URIs for both development and production

## 6. Set Up Email for MFA

1. Go to Authentication > Email Templates
2. Configure the "Magic Link" template which will be used for OTP
3. Ensure your Supabase project has email confirmed

## 7. Test the Setup

Make sure everything works correctly by:
1. Creating a new user account
2. Uploading a file to the storage bucket
3. Logging in with Google authentication
4. Enabling MFA for a user
5. Verifying activities are logged properly

## Troubleshooting Common Issues

### 1. Policy Recursion Errors

If you see an error like `infinite recursion detected in policy for relation "profiles"`, it means your RLS policies are creating a circular reference. Make sure to use the latest schema from `src/lib/supabase-schema.sql`.

### 2. Environment Variables Not Loading

If you get a "supabaseUrl is required" error, your environment variables aren't being loaded. Make sure:
- You've created a `.env` file in the project root
- The variable names start with `VITE_` (for Vite projects)
- You've restarted your development server after adding the variables

### 3. Storage Bucket Issues

If file uploads aren't working, ensure:
- The "files" bucket is created
- RLS policies for storage are properly set up
- The storage trigger in the schema file is uncommented and executed

## Database Schema Overview

The application uses the following tables:

- **profiles**: User profiles linked to auth.users
- **files**: File metadata for uploaded files
- **activities**: User activity logs
- **notifications**: User notifications
- **mfa_verifications**: MFA verification codes
- **settings**: Application settings

Each table has Row Level Security (RLS) policies that restrict data access based on user roles and ownership.

## Triggers

The schema includes two important triggers:

1. **on_auth_user_created**: Automatically creates a profile when a user signs up
2. **on_storage_object_insert**: Updates the files table when a file is uploaded (needs to be uncommented after bucket creation)

For any issues, check the Supabase logs in the dashboard.
