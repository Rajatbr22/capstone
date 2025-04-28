import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'files')
 * @returns Promise with the file data or error
 */
export const uploadFileToSupabase = async (
  file: File,
  bucket: string = 'files'
): Promise<{ path: string; id: string; filename: string; size: number; type: string, publicUrl: string } | null> => {
  try {
    // Generate a unique file ID
    const fileId = uuidv4();
    
    // Create a unique path with the original filename preserved
    const fileExt = file.name.split('.').pop();
    const filePath = `${fileId}/${file.name}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading file to Supabase:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    const publicUrl = urlData.publicUrl;
    
    return {
      path: filePath, // Store the actual path for later operations like delete
      id: fileId,
      filename: file.name,
      size: file.size,
      type: file.type,
      publicUrl: publicUrl, // Add the public URL for displaying files
    };
  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    return null;
  }
};

/**
 * Upload a file to the Flask backend as fallback
 * @param file The file to upload
 * @returns Promise with the file data or error
 */
export const uploadFileToBackend = async (
  file: File
): Promise<{ path: string; id: string; filename: string; size: number; type: string } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Backend upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Unknown error during file upload');
    }
    
    return {
      path: result.file.path,
      id: result.file.id,
      filename: result.file.name,
      size: result.file.size,
      type: result.file.type,
    };
  } catch (error) {
    console.error('Error in uploadFileToBackend:', error);
    return null;
  }
};

/**
 * Smart file upload function that tries Supabase first, then falls back to backend
 * @param file The file to upload
 * @returns Promise with the file data or error
 */
export const uploadFile = async (
  file: File
): Promise<{ path: string; id: string; filename: string; size: number; type: string } | null> => {
  // Check if Supabase is configured
  if (canUseSupabaseStorage()) {
    try {
      // Try Supabase upload first
      const result = await uploadFileToSupabase(file);
      if (result) return result;
    } catch (error) {
      console.warn('Supabase upload failed, falling back to backend:', error);
    }
  }
  
  // Fall back to backend upload if Supabase fails or isn't configured
  return uploadFileToBackend(file);
};

/**
 * Get a list of files from Supabase storage with full details
 * @param bucket The storage bucket name (default: 'files')
 * @returns Promise with the list of files or empty array
 */
export const getFilesFromSupabase = async (bucket: string = 'files'): Promise<any[]> => {
  try {
    // First get the list of directories (each upload creates a directory with the file ID)
    const { data: directories, error: dirError } = await supabase.storage
      .from(bucket)
      .list();
      
    if (dirError) {
      console.error('Error getting directories from Supabase:', dirError);
      return [];
    }
    
    const files = [];
    
    // For each directory, get the files inside
    for (const dir of directories || []) {
      if (!dir.name) continue;
      
      const { data: dirFiles, error: filesError } = await supabase.storage
        .from(bucket)
        .list(dir.name);
        
      if (filesError) {
        console.error(`Error listing files in directory ${dir.name}:`, filesError);
        continue;
      }
      
      // For each file, create a file object with metadata
      for (const file of dirFiles || []) {
        if (!file.name) continue;
        
        const filePath = `${dir.name}/${file.name}`;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
          
        files.push({
          id: dir.name, // Directory name is the file ID we generated
          name: file.name,
          path: filePath,
          publicUrl: urlData.publicUrl,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || file.name.split('.').pop(),
          uploadedAt: new Date(file.metadata?.lastModified || Date.now())
        });
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error in getFilesFromSupabase:', error);
    return [];
  }
};

/**
 * Get a list of files from the backend API
 * @returns Promise with the list of files or empty array
 */
export const getFilesFromBackend = async (): Promise<any[]> => {
  try {
    const response = await fetch('/api/files');
    
    if (!response.ok) {
      throw new Error(`Backend failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error('Error getting files from backend:', error);
    return [];
  }
};

/**
 * Smart function to get files from either Supabase or backend
 * @returns Promise with the list of files or empty array
 */
export const getFiles = async (): Promise<any[]> => {
  if (canUseSupabaseStorage()) {
    try {
      const files = await getFilesFromSupabase();
      if (files.length > 0) return files;
    } catch (error) {
      console.warn('Supabase file listing failed, falling back to backend:', error);
    }
  }
  
  return getFilesFromBackend();
};

/**
 * Delete a file from Supabase storage
 * @param path The file path to delete
 * @param bucket The storage bucket name (default: 'files')
 * @returns Promise with success status
 */
export const deleteFileFromSupabase = async (
  path: string,
  bucket: string = 'files'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) {
      console.error('Error deleting file from Supabase:', error);
      return false;
    }
    
    console.log('Successfully deleted file from Supabase:', path);
    return true;
  } catch (error) {
    console.error('Error in deleteFileFromSupabase:', error);
    return false;
  }
};

/**
 * Delete a file using the backend API
 * @param fileId The ID of the file to delete
 * @returns Promise with success status
 */
export const deleteFileFromBackend = async (fileId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Backend delete failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Error deleting file from backend:', error);
    return false;
  }
};

/**
 * Smart function to delete a file from either Supabase or backend
 * @param fileId The ID of the file
 * @param path The path of the file (for Supabase)
 * @returns Promise with success status
 */
export const deleteFile = async (fileId: string, path?: string): Promise<boolean> => {
  if (canUseSupabaseStorage() && path) {
    try {
      const success = await deleteFileFromSupabase(path);
      if (success) return true;
    } catch (error) {
      console.warn('Supabase delete failed, falling back to backend:', error);
    }
  }
  
  return deleteFileFromBackend(fileId);
};

/**
 * Helper function to check if Supabase is properly configured
 * @returns boolean indicating if file upload can use Supabase
 */
export const canUseSupabaseStorage = (): boolean => {
  // Check if Supabase is configured properly
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return !!supabaseUrl && !!supabaseKey;
};
