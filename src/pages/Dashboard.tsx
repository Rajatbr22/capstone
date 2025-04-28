
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, AlertTriangle } from 'lucide-react';
import { uploadFile, canUseSupabaseStorage } from '@/lib/file-upload';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/use-supabase';
import { useFiles } from '@/contexts/FileContext';

const Dashboard: React.FC = () => {
  const { getRecentActivities } = useActivity();
  const { auth } = useAuth();
  const { toast } = useToast();
  const { isLoading: isSupabaseLoading } = useSupabase();
  const { uploadFile: uploadFileToContext } = useFiles();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    recentlyScanned: 0,
    threatDetected: 0
  });
  
  // Setup file input reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Get user-specific recent activities
  const recentActivities = getRecentActivities(3);
  
  useEffect(() => {
    // Fetch user-specific data
    const fetchUserData = async () => {
      setIsLoadingStats(true);
      try {
        // This would normally fetch real stats from Supabase for the specific user
        // For now, we'll set some example values with a delay to simulate loading
        setTimeout(() => {
          setFileStats({
            totalFiles: auth.user?.id ? Math.floor(Math.random() * 10000) : 0,
            recentlyScanned: auth.user?.id ? Math.floor(Math.random() * 1000) : 0,
            threatDetected: auth.user?.id ? Math.floor(Math.random() * 20) : 0
          });
          setIsLoadingStats(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoadingStats(false);
      }
    };
    
    if (auth.isAuthenticated && auth.user) {
      fetchUserData();
    }
  }, [auth.isAuthenticated, auth.user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Use the FileContext's uploadFile function to handle uploading to Supabase
      const success = await uploadFileToContext(files);
      
      if (success) {
        toast({
          title: "File Uploaded",
          description: `${files.length > 1 ? `${files.length} files have` : `${files[0].name} has`} been uploaded successfully`,
        });
        
        // Update file stats
        setFileStats(prev => ({
          ...prev,
          totalFiles: prev.totalFiles + files.length,
          recentlyScanned: prev.recentlyScanned + files.length
        }));
      } else {
        toast({
          title: "Upload Failed",
          description: "There was a problem uploading your file(s)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file(s)",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {auth.isAuthenticated 
                ? `Welcome, ${auth.user?.username || 'User'}!` 
                : 'Welcome to ZeroSecure AI'}
            </p>
          </div>
          
          {auth.isAuthenticated && (
            <div className="mt-4 md:mt-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.gif"
              />
              <Button 
                onClick={triggerFileUpload} 
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>Number of registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  '1,250'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files Uploaded</CardTitle>
              <CardDescription>Total files stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  fileStats.totalFiles.toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  '75'
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Scanning</CardTitle>
              <CardDescription>Files analyzed for threats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-2">
                  <div className="h-8 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-8 w-2/3 bg-muted animate-pulse rounded"></div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">{fileStats.recentlyScanned}</div>
                    <div className="text-sm text-muted-foreground">Files scanned</div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-2 rounded-md">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <div>
                      <div className="text-lg font-bold">{fileStats.threatDetected}</div>
                      <div className="text-xs">Threats detected</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-2">
                  <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
                </div>
              ) : recentActivities.length > 0 ? (
                <ul className="space-y-2">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="border-b pb-2 last:border-0">
                      User {activity.userId} {activity.action} {activity.resource}.
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activity to display.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
