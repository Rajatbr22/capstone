import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, File as AppFile, NLPAnalysisResult } from '@/types';
import { toast } from './use-toast';
import { uploadFile, uploadFileToSupabase } from '@/lib/file-upload';

export function useSupabase() {
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Toggle MFA for a user
   */
  const toggleMfa = async (user: User, enable: boolean): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        // In mock mode, just simulate success
        toast({
          title: "MFA " + (enable ? "Enabled" : "Disabled"),
          description: "Your multi-factor authentication settings have been updated (demo mode)",
        });
        return true;
      }
      
      // Update the user's MFA status in the database
      const { error } = await supabase
        .from('profiles')
        .update({ mfa_enabled: enable })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating MFA status:', error);
        toast({
          title: "Error",
          description: "Failed to update MFA settings",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "MFA " + (enable ? "Enabled" : "Disabled"),
        description: "Your multi-factor authentication settings have been updated",
      });
      
      return true;
    } catch (error) {
      console.error('Error toggling MFA:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get a signed URL for a file in Supabase Storage
   */
  const getFileUrl = async (filePath: string): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      // For demo mode, return a mock URL
      return `https://example.com/mock-file/${filePath}`;
    }
    
    try {
      // Try to get a public URL first
      const { data: publicData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);
        
      if (publicData && publicData.publicUrl) {
        return publicData.publicUrl;
      }
      
      // If public URL is not available, try to get a signed URL
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
        
      if (error || !data) {
        console.error('Error getting signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };
  
  /**
   * Get public profile information for a user
   */
  const getUserProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured()) {
        // Return mock data in demo mode
        return {
          id: userId,
          username: "demo_user",
          email: "demo@example.com",
          role: "user",
          mfaEnabled: false,
          lastLogin: new Date(),
          riskScore: 0.1
        };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, role, mfa_enabled, last_login, risk_score')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error('Error getting user profile:', error);
        return null;
      }
      
      return {
        id: userId,
        username: data.username,
        email: data.email,
        role: data.role,
        mfaEnabled: data.mfa_enabled,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
        riskScore: data.risk_score
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };
  
  /**
   * Store NLP analysis results in Supabase
   */
  const storeFileAnalysis = async (fileId: string, analysis: NLPAnalysisResult): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      // In mock mode, simulate success
      console.log('Storing analysis in mock mode:', { fileId, analysis });
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('files')
        .update({ 
          content_analysis: analysis,
          threat_score: analysis.anomalyScore || 0
        })
        .eq('id', fileId);
        
      if (error) {
        console.error('Error storing analysis:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error storing file analysis:', error);
      return false;
    }
  };
  
  /**
   * Get file analysis results from Supabase
   */
  const getFileAnalysis = async (fileId: string): Promise<NLPAnalysisResult | null> => {
    if (!isSupabaseConfigured()) {
      // Return mock analysis in demo mode
      return {
        contentCategory: ['document', 'text'],
        keywords: ['example', 'mock', 'data'],
        language: 'english',
        readingLevel: 'intermediate',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: [],
        confidenceScore: 0.95,
        anomalyScore: 0.05
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('content_analysis')
        .eq('id', fileId)
        .single();
        
      if (error || !data || !data.content_analysis) {
        console.error('Error getting file analysis:', error);
        return null;
      }
      
      return data.content_analysis as NLPAnalysisResult;
    } catch (error) {
      console.error('Error getting file analysis:', error);
      return null;
    }
  };

  /**
   * Upload a file and store it in Supabase or backend
   */
  const uploadUserFile = async (file: globalThis.File, userId: string): Promise<AppFile | null> => {
    try {
      setIsLoading(true);
      let result;
      
      // If Supabase is configured, use Supabase storage directly
      if (isSupabaseConfigured()) {
        result = await uploadFileToSupabase(file);
      } else {
        // Otherwise use the general upload function with fallback
        result = await uploadFile(file);
      }
      
      if (!result) {
        throw new Error('File upload failed');
      }
      
      // Create a File object from the upload result
      const fileRecord: AppFile = {
        id: result.id,
        name: result.filename,
        path: result.path,
        type: result.type,
        size: result.size,
        uploadedAt: new Date(),
        uploadedBy: userId,
        accessLevel: ['user'],
        threatScore: 0,
        tags: [],
        publicUrl: result.publicUrl || '',
      };
      
      // If Supabase is configured, store the file record
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('files').insert([{
          id: fileRecord.id,
          name: fileRecord.name,
          type: fileRecord.type,
          size: fileRecord.size,
          path: fileRecord.path,
          public_url: fileRecord.publicUrl,
          uploaded_by: userId,
          uploaded_at: new Date().toISOString(),
          access_level: ['user'],
          threat_score: 0,
          tags: []
        }]);
        
        if (error) {
          console.error('Error adding file to database:', error);
        }
      }
      
      return fileRecord;
    } catch (error) {
      console.error('Error uploading user file:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get all files from Supabase database
   */
  const getUserFiles = async (userId: string): Promise<AppFile[]> => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        // Return mock data
        return [];
      }
      
      // Query the files table for user's files
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('uploaded_by', userId);
        
      if (error) {
        console.error('Error getting user files:', error);
        return [];
      }
      
      // Map the database records to AppFile objects
      return (data || []).map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        publicUrl: file.public_url || '',
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.uploaded_at),
        uploadedBy: file.uploaded_by,
        accessLevel: file.access_level || ['user'],
        threatScore: file.threat_score || 0,
        tags: file.tags || [],
        contentAnalysis: file.content_analysis || null
      }));
    } catch (error) {
      console.error('Error in getUserFiles:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    toggleMfa,
    getFileUrl,
    getUserProfile,
    storeFileAnalysis,
    getFileAnalysis,
    uploadUserFile,
    getUserFiles,
    supabase
  };
}
