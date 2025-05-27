import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { File, NLPAnalysisResult, Role } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { generateMockFiles } from '@/lib/mock-data';
import { useSupabase } from '@/hooks/use-supabase';
import { nlpService, evaluateSecurityRisk } from '@/lib/nlp-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/file-upload';
import { v4 as uuidv4 } from 'uuid';
import fetchWithAuth from '@/lib/fetchInstance';

interface FileContextType {
  files: File[];
  isLoading: boolean;
  getUserAccessibleFiles: () => File[];
  getFileById: (id: string) => File | null;
  uploadFile: (files: FileList) => Promise<boolean>;
  deleteFile: (id: string) => Promise<boolean>;
  scanFile: (file: File) => Promise<NLPAnalysisResult>;
  updateFileAccess: (id: string, roles: Role[]) => Promise<boolean>;
  addTagToFile: (id: string, tag: string) => Promise<boolean>;
  removeTagFromFile: (id: string, tag: string) => Promise<boolean>;
  downloadFile: (id: string) => Promise<boolean>;
  previewFile: (id: string) => Promise<string | null>;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  const { logActivity } = useActivity();
  const { getFileUrl } = useSupabase();
  
  // Load files on component mount or when auth changes
  const loadFiles = async () => {
    setIsLoading(true);
    
    try {
      // Only load files if authenticated
      if (!auth.isAuthenticated || !auth.user) {
        setFiles([]);
        return;
      }
      
      if (isSupabaseConfigured()) {
        console.log('Loading files from Supabase');
        
        try {
          // Fetch real files from Supabase
          const { data, error } = await supabase
            .from('files')
            .select('*');
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log('Loaded files from Supabase:', data.length);
            
            // Map Supabase data to our File type
            const mappedFiles: File[] = await Promise.all(data.map(async file => {
              // Get the public URL for each file
              const { data: urlData } = supabase.storage
                .from('files')
                .getPublicUrl(file.path);
                
              return {
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size,
                path: file.path,
                uploadedBy: file.uploaded_by,
                uploadedAt: new Date(file.uploaded_at),
                accessLevel: file.access_level || ['user'],
                threatScore: file.threat_score || 0,
                tags: file.tags || [],
                contentAnalysis: file.content_analysis || null,
                publicUrl: urlData.publicUrl || file.public_url || '',
              };
            }));
            
            setFiles(mappedFiles);
            return;
          } else {
            console.log('No files found in Supabase, using mock data');
          }
        } catch (supabaseError) {
          console.error('Error fetching files from Supabase:', supabaseError);
          console.log('Falling back to mock data due to error');
        }
      } else {
        console.log('Supabase not configured, using mock data');
      }
      
      // If we get here, either Supabase isn't configured or there were no files or there was an error
      // Fall back to mock data
      const mockFiles = generateMockFiles();
      setFiles(mockFiles);
      
    } catch (error) {
      console.error('Error loading files:', error);
      // Fallback to mock data
      const mockFiles = generateMockFiles();
      setFiles(mockFiles);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load files when auth changes
  useEffect(() => {
    loadFiles();
  }, [auth.isAuthenticated, auth.user?.id]);
  
  // Function to refresh files (can be called manually)
  const refreshFiles = async (): Promise<void> => {
    await loadFiles();
  };
  
  /**
   * Get files accessible to the current user based on their role
   */
  const getUserAccessibleFiles = (): File[] => {
    if (!auth.user) return [];
    
    return files.filter(file => 
      file.accessLevel.includes(auth.user.role)
    );
  };
  
  /**
   * Get a file by its ID
   */
  const getFileById = (id: string): File | null => {
    return files.find(file => file.id === id) || null;
  };
  
  /**
   * Upload new files to Supabase or mock storage
   */
  // const uploadFile = async (fileList: FileList): Promise<boolean> => {
  //   if (!auth.user) {
  //     toast({
  //       title: "Authentication Required",
  //       description: "You must be logged in to upload files",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
    
  //   setIsLoading(true);
    
  //   try {
  //     const newFiles: File[] = [];
      
  //     // Process each file in the list
  //     for (let i = 0; i < fileList.length; i++) {
  //       const file = fileList[i];
        
  //       if (isSupabaseConfigured()) {
  //         try {
  //           console.log('Uploading to Supabase:', file.name);

  //           const fileId = uuidv4();
  //           const result = await uploadFileToSupabase(file);
            
  //           if (!result) {
  //             console.error('Failed to upload file to Supabase storage');
  //             continue;
  //           }
            
  //           // Create a file record
  //           const fileRecord: File = {
  //             id: result.id,
  //             name: file.name,
  //             type: result.type,
  //             size: file.size,
  //             path: result.path,
  //             publicUrl: result.publicUrl || '',
  //             uploadedBy: auth.user.id,
  //             uploadedAt: new Date(),
  //             accessLevel: ['admin', 'manager', auth.user.role],
  //             threatScore: 0,
  //             tags: [],
  //           };
            
  //           // Store file metadata in database
  //           const { data, error } = await supabase
  //             .from('files')
  //             .insert({
  //               id: fileRecord.id,
  //               name: fileRecord.name,
  //               type: fileRecord.type,
  //               size: fileRecord.size,
  //               path: fileRecord.path,
  //               public_url: fileRecord.publicUrl,
  //               uploaded_by: fileRecord.uploadedBy,
  //               uploaded_at: new Date().toISOString(),
  //               access_level: fileRecord.accessLevel,
  //               threat_score: 0,
  //               tags: []
  //             })
  //             .select();
              
  //           if (error) {
  //             console.error('Error adding file to database:', error);
  //           } else {
  //             console.log('File added to database:', data);
  //             newFiles.push(fileRecord);
              
  //             // Process file with NLP service right after upload (in background)
  //             nlpService.processFileAndStoreResults(fileRecord)
  //               .then(analysisResult => {
  //                 if (analysisResult) {
  //                   // Update the file with analysis results
  //                   setFiles(prevFiles => 
  //                     prevFiles.map(f => 
  //                       f.id === fileRecord.id 
  //                         ? {...f, 
  //                           contentAnalysis: analysisResult, 
  //                           threatScore: analysisResult.anomalyScore || 0
  //                         } 
  //                         : f
  //                     )
  //                   );
  //                 }
  //               })
  //               .catch(err => console.error('Error analyzing file:', err));
  //           }
            
  //         } catch (uploadError) {
  //           console.error('Error uploading file to Supabase:', uploadError);
  //         }
  //       } else {
  //         // Create a mock file object for non-Supabase mode
  //         const fileRecord: File = {
  //           id: `file-${Date.now()}-${i}`,
  //           name: file.name,
  //           type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
  //           size: file.size,
  //           path: `/files/${file.name}`,
  //           uploadedBy: auth.user.id,
  //           uploadedAt: new Date(),
  //           accessLevel: ['admin', 'manager', auth.user.role],
  //           threatScore: 0,
  //           tags: [],
  //         };
          
  //         // For images, create a data URL for preview
  //         if (file.type.startsWith('image/')) {
  //           const reader = new FileReader();
  //           await new Promise<void>((resolve) => {
  //             reader.onload = () => {
  //               fileRecord.content = reader.result as string;
  //               resolve();
  //             };
  //             reader.readAsDataURL(file);
  //           });
  //         }
          
  //         // For text files, read the content
  //         if (file.type === 'text/plain' || file.type === 'application/json') {
  //           const reader = new FileReader();
  //           await new Promise<void>((resolve) => {
  //             reader.onload = () => {
  //               fileRecord.content = reader.result as string;
  //               resolve();
  //             };
  //             reader.readAsText(file);
  //           });
  //         }
          
  //         newFiles.push(fileRecord);
  //       }
  //     }
      
  //     // Add the new files to the state
  //     setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
  //     // Log the activity
  //     if (newFiles.length > 0) {
  //       logActivity('upload', newFiles.map(f => f.id).join(','));
        
  //       toast({
  //         title: "Files Uploaded",
  //         description: `Successfully uploaded ${newFiles.length} file(s)`,
  //       });
        
  //       return true;
  //     } else {
  //       toast({
  //         title: "Upload Failed",
  //         description: "Could not upload any files",
  //         variant: "destructive",
  //       });
        
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error uploading files:', error);
  //     toast({
  //       title: "Upload Failed",
  //       description: "There was an error uploading your files",
  //       variant: "destructive",
  //     });
  //     return false;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  

  const uploadFile = async (fileList: FileList): Promise<boolean> => {

    const token = sessionStorage.getItem('token');

    if (!token) {
      console.log('No auth token, cannot refresh session');
      return;
    }

    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      const newFiles: File[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const formData = new FormData();

        formData.append('file', file);
        formData.append('userId', auth.user.id);
        formData.append('uploadedByUserName', auth.user.username);
        formData.append('accessLevel', auth.user.role);
        formData.append('riskScore', 0);
        formData.append('userName', auth.user.username)
        formData.append('departmentId', auth.user.department_id);
        formData.append('isPublic', 'true'); 
        formData.append('tags', '');

        const response = await fetchWithAuth('/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          console.error(`Failed to upload ${file.name}`);
          continue;
        }

        const uploaded = await response.json();
        const fileRecord: File = {
          id: uploaded._id,
          name: uploaded.fileName,
          type: uploaded.type,
          size: uploaded.size,
          path: uploaded.path,
          publicUrl: uploaded.path,
          uploadedBy: uploaded.uploadedByUserId,
          uploadedAt: new Date(uploaded.createdAt),
          accessLevel: uploaded.accessLevel,
          threatScore: uploaded.riskScore,
          tags: uploaded.tags,
          contentAnalysis: uploaded.contentAnalysis,
        };

        newFiles.push(fileRecord);
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        logActivity('upload', newFiles.map(f => f.id).join(','));

        toast({
          title: "Files Uploaded",
          description: `Successfully uploaded ${newFiles.length} file(s)`,
        });

        return true;
      } else {
        toast({
          title: "Upload Failed",
          description: "No files were uploaded",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };





  /**
   * Delete a file by ID from Supabase or mock storage
   */
  const deleteFile = async (id: string): Promise<boolean> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete files",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Find the file to delete
      const fileToDelete = files.find(file => file.id === id);
      
      if (!fileToDelete) {
        toast({
          title: "File Not Found",
          description: "The file you're trying to delete doesn't exist",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if user has permission to delete
      if (auth.user.role !== 'admin' && auth.user.role !== 'manager' && fileToDelete.uploadedBy !== auth.user.id) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to delete this file",
          variant: "destructive",
        });
        return false;
      }
      
      // If Supabase is configured, delete from storage and database
      if (isSupabaseConfigured()) {
        try {
          // Delete from storage if it exists there
          if (fileToDelete.path) {
            const { error: storageError } = await supabase
              .storage
              .from('files')
              .remove([fileToDelete.path]);
              
            if (storageError) {
              console.error('Error deleting from storage:', storageError);
              // Continue with database delete even if storage delete fails
            }
          }
          
          // Delete from database
          const { error: dbError } = await supabase
            .from('files')
            .delete()
            .eq('id', id);
            
          if (dbError) {
            console.error('Error deleting from database:', dbError);
            // Continue with local delete even if database delete fails
          }
        } catch (supabaseError) {
          console.error('Supabase delete error:', supabaseError);
          // Continue with local delete as fallback
        }
      }
      
      // Remove the file from state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
      
      // Log the activity
      logActivity('delete', id);
      
      toast({
        title: "File Deleted",
        description: "The file has been successfully deleted",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the file",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Scan file content for security threats and analyze content
   */
  const scanFile = async (file: File): Promise<NLPAnalysisResult> => {
    setIsLoading(true);
    
    try {
      // First check if we already have analysis results in Supabase
      if (isSupabaseConfigured()) {
        const existingAnalysis = await nlpService.getFileAnalysisFromSupabase(file.id);
        
        if (existingAnalysis) {
          console.log('Retrieved existing analysis from Supabase');
          
          // Update the file with the analysis results
          const updatedFiles = files.map(f => 
            f.id === file.id 
              ? {...f, contentAnalysis: existingAnalysis, threatScore: existingAnalysis.anomalyScore || 0} 
              : f
          );
          
          setFiles(updatedFiles);
          return existingAnalysis;
        }
      }
      
      // No existing analysis, try to get file content
      let fileContent = file.content;
      if (!fileContent && file.type !== 'jpg' && file.type !== 'png') {
        // Try to fetch file content from Supabase if available
        if (isSupabaseConfigured() && file.path) {
          const { data, error } = await supabase
            .storage
            .from('files')
            .download(file.path);
            
          if (!error && data) {
            // Convert blob to text for text files
            if (file.type === 'txt' || file.type === 'json' || file.type === 'md') {
              fileContent = await data.text();
            } else {
              // For other file types, we might need different processing
              fileContent = "Binary file content";
            }
          }
        }
        
        // If still no content, use a fallback
        if (!fileContent) {
          fileContent = "Sample file content for analysis.";
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Using mock file content for analysis.');
          }
        }
      }
      
      // If we have actual text content, send it to our NLP service
      if (fileContent && typeof fileContent === 'string') {
        try {
          // Check if our Flask NLP service is available
          const isHealthy = await nlpService.checkHealth();
          
          if (isHealthy) {
            // Use our Flask NLP service for analysis
            const results = await nlpService.analyzeText(fileContent);
            
            // Store results in Supabase if configured
            if (isSupabaseConfigured()) {
              const { error } = await supabase
                .from('files')
                .update({ 
                  content_analysis: results,
                  threat_score: results.anomalyScore || 0
                })
                .eq('id', file.id);
                
              if (error) {
                console.error('Error storing analysis in Supabase:', error);
              }
            }
            
            // Update the file with the analysis results
            const updatedFiles = files.map(f => 
              f.id === file.id 
                ? {...f, contentAnalysis: results, threatScore: results.anomalyScore || 0} 
                : f
            );
            
            setFiles(updatedFiles);
            return results;
          } else {
            console.log('Flask NLP service unavailable, using mock analysis');
          }
        } catch (error) {
          console.error('Error using Flask NLP service:', error);
          console.log('Falling back to mock analysis');
        }
      }
      
      // If the Flask service isn't available or we couldn't process the content,
      // fall back to the mock implementation
      
      // Mock NLP analysis results
      const mockResults: NLPAnalysisResult = {
        contentCategory: ['document', 'text'],
        keywords: ['security', 'data', 'protection', 'privacy', 'user'],
        language: 'english',
        readingLevel: 'intermediate',
        sensitiveContent: Math.random() > 0.7,
        maliciousContent: Math.random() > 0.9,
        detectedEntities: ['name', 'organization', 'location'],
        confidenceScore: 0.85,
        anomalyScore: Math.random() * 0.5
      };
      
      // Update the file with the mock analysis results
      const updatedFiles = files.map(f => 
        f.id === file.id 
          ? {...f, contentAnalysis: mockResults, threatScore: mockResults.anomalyScore || 0} 
          : f
      );
      
      setFiles(updatedFiles);
      return mockResults;
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze file content",
        variant: "destructive",
      });
      
      // Return a minimal analysis result on error
      const fallbackResults: NLPAnalysisResult = {
        contentCategory: ['unknown'],
        keywords: [],
        language: 'unknown',
        readingLevel: 'unknown',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: [],
        confidenceScore: 0,
        anomalyScore: 0.1
      };
      
      return fallbackResults;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Update file access permissions in Supabase or mock storage
   */
  const updateFileAccess = async (id: string, roles: Role[]): Promise<boolean> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update file access",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if user has permission to update access
    if (auth.user.role !== 'admin' && auth.user.role !== 'manager') {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update file access",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Update in Supabase if configured
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('files')
          .update({ access_level: roles })
          .eq('id', id);
          
        if (error) {
          console.error('Error updating access level in Supabase:', error);
          // Continue with local update even if Supabase update fails
        }
      }
      
      // Update the file access level in state
      const updatedFiles = files.map(file => 
        file.id === id 
          ? {...file, accessLevel: roles} 
          : file
      );
      
      setFiles(updatedFiles);
      
      // Log the activity
      logActivity('access', id);
      
      toast({
        title: "Access Updated",
        description: "File access permissions have been updated",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating file access:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating file access",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Add a tag to a file
   */
  const addTagToFile = async (id: string, tag: string): Promise<boolean> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add tags",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Find the file
      const fileToUpdate = files.find(file => file.id === id);
      
      if (!fileToUpdate) {
        toast({
          title: "File Not Found",
          description: "The file you're trying to update doesn't exist",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if tag already exists
      if (fileToUpdate.tags.includes(tag)) {
        toast({
          title: "Tag Already Exists",
          description: "This tag is already applied to the file",
          variant: "destructive",
        });
        return false;
      }
      
      // Add the tag
      const updatedFiles = files.map(file => 
        file.id === id 
          ? {...file, tags: [...file.tags, tag]} 
          : file
      );
      
      setFiles(updatedFiles);
      
      toast({
        title: "Tag Added",
        description: `Added tag "${tag}" to the file`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Update Failed",
        description: "There was an error adding the tag",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Remove a tag from a file
   */
  const removeTagFromFile = async (id: string, tag: string): Promise<boolean> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to remove tags",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Update the file tags
      const updatedFiles = files.map(file => 
        file.id === id 
          ? {...file, tags: file.tags.filter(t => t !== tag)} 
          : file
      );
      
      setFiles(updatedFiles);
      
      toast({
        title: "Tag Removed",
        description: `Removed tag "${tag}" from the file`,
      });
      
      return true;
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Update Failed",
        description: "There was an error removing the tag",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Download a file
   */
  const downloadFile = async (id: string): Promise<boolean> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to download files",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Find the file
      const fileToDownload = files.find(file => file.id === id);
      
      if (!fileToDownload) {
        toast({
          title: "File Not Found",
          description: "The file you're trying to download doesn't exist",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if user has access
      if (!fileToDownload.accessLevel.includes(auth.user.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to download this file",
          variant: "destructive",
        });
        return false;
      }
      
      // In Supabase mode, get a download URL and trigger a download
      if (isSupabaseConfigured() && fileToDownload.path) {
        try {
          // First try to use the publicUrl if available
          let downloadUrl = fileToDownload.publicUrl;
          
          if (!downloadUrl) {
            // Otherwise get a signed URL
            const signedUrl = await getFileUrl(fileToDownload.path);
            if (!signedUrl) {
              throw new Error('Could not generate download URL');
            }
            downloadUrl = signedUrl;
          }
          
          // Create a temporary link to trigger the download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileToDownload.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Error downloading file:', error);
          toast({
            title: "Download Failed",
            description: "Could not download the file",
            variant: "destructive",
          });
          return false;
        }
      } else {
        // For demo mode or if file has content in memory
        if (fileToDownload.content && typeof fileToDownload.content === 'string') {
          // For data URLs or text content
          const link = document.createElement('a');
          
          // Check if it's already a data URL
          if (fileToDownload.content.startsWith('data:')) {
            link.href = fileToDownload.content;
          } else {
            // Create a data URL from text content
            const blob = new Blob([fileToDownload.content], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
          }
          
          link.download = fileToDownload.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.log('No file content available for download in demo mode');
          // Simulate success in demo mode
          toast({
            title: "Download Simulated",
            description: "In demo mode, downloads are simulated",
          });
        }
      }
      
      // Log the activity with the appropriate risk level
      const riskLevel = fileToDownload.contentAnalysis 
        ? evaluateSecurityRisk(fileToDownload.contentAnalysis)
        : 'low';
      
      logActivity('download', id, riskLevel);
      
      toast({
        title: "Download Started",
        description: `Downloading ${fileToDownload.name}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Preview file content
   */
  const previewFile = async (id: string): Promise<string | null> => {
    if (!auth.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to preview files",
        variant: "destructive",
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Find the file
      const fileToPreview = files.find(file => file.id === id);
      
      if (!fileToPreview) {
        toast({
          title: "File Not Found",
          description: "The file you're trying to preview doesn't exist",
          variant: "destructive",
        });
        return null;
      }
      
      // Check if user has access
      if (!fileToPreview.accessLevel.includes(auth.user.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to preview this file",
          variant: "destructive",
        });
        return null;
      }
      
      // Log the activity
      logActivity('access', id);
      
      // If we already have the content, return it
      if (fileToPreview.content && typeof fileToPreview.content === 'string') {
        return fileToPreview.content;
      }
      
      // If Supabase is configured and this is a text file, try to download the content
      if (isSupabaseConfigured() && fileToPreview.path) {
        const isTextFile = /\.(txt|json|md|csv|html|xml|js|ts|jsx|tsx|css|scss|log)$/i.test(fileToPreview.name);
        
        if (isTextFile) {
          try {
            const { data, error } = await supabase.storage
              .from('files')
              .download(fileToPreview.path);
              
            if (!error && data) {
              const textContent = await data.text();
              
              // Update the file in state with the content
              setFiles(prevFiles => 
                prevFiles.map(f => f.id === id ? {...f, content: textContent} : f)
              );
              
              return textContent;
            }
          } catch (error) {
            console.error('Error downloading file for preview:', error);
          }
        }
      }
      
      // For images and other non-text files, just return the URL
      if (fileToPreview.publicUrl) {
        return `[Image URL: ${fileToPreview.publicUrl}]`;
      }
      
      // Otherwise, return a placeholder
      return `This is a preview of ${fileToPreview.name}.\n\nIn a real application, this would show the actual file content.`;
    } catch (error) {
      console.error('Error previewing file:', error);
      toast({
        title: "Preview Failed",
        description: "There was an error generating the preview",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    files,
    isLoading,
    getUserAccessibleFiles,
    getFileById,
    uploadFile,
    deleteFile,
    scanFile,
    updateFileAccess,
    addTagToFile,
    removeTagFromFile,
    downloadFile,
    previewFile,
    refreshFiles
  };
  
  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = (): FileContextType => {
  const context = useContext(FileContext);
  
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  
  return context;
};
