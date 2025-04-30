
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MFAVerification from './pages/MFAVerification';
import Files from './pages/Files';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ContactAdmin from './pages/ContactAdmin';
import Users from './pages/Users';
import CaptchaVerificationPage from './pages/CaptchaVerificationPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FileProvider } from './contexts/FileContext';
import { SupabaseProvider } from './contexts/SupabaseProvider';
import { useEffect } from 'react';
import DepartmentSelection from './pages/DepartmentSelection';

function App() {

  useEffect(() => {
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };
    
    // Preload some common avatars
    preloadImage('https://avatars.dicebear.com/api/initials/user.svg');
    
    if (!localStorage.getItem('supabase.auth.token')) {
      console.log('App: No active auth token, clearing MFA state');
      localStorage.removeItem('mfaVerified');
      localStorage.removeItem('currentOTP');
    }
    
    console.log('App: Initializing with MFA status:', {
      mfaVerified: localStorage.getItem('mfaVerified'),
      hasAuthToken: !!localStorage.getItem('supabase.auth.token'),
    });
    

    const createSupabaseBuckets = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
        
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, skipping bucket creation');
          return;
        }
        
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error listing buckets:', error);
          return;
        }else{
          console.log(buckets)
        }
        
        // Check if the files bucket exists
        const filesBucketExists = buckets?.some(bucket => bucket.name === 'files');
        
        // if (!filesBucketExists) {
        //   console.log('Creating files bucket');
          
        //   const { error: createError } = await supabase.storage.createBucket('files', {
        //     public: true,
        //     allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/json'],
        //     fileSizeLimit: 5242880, // 5MB
        //   });
          
        //   if (createError) {
        //     console.error('Error creating files bucket:', createError);
        //   } else {
        //     console.log('Files bucket created successfully');
        //   }
        // } else {
        //   console.log('Files bucket already exists');
        // }

        if (!filesBucketExists) {
          console.warn('Files bucket does not exist. Please create it from the Supabase dashboard.');
        } 
        else {
          console.log('Files bucket exists and is ready to use');
        }
      } catch (error) {
        console.error('Error initializing Supabase buckets:', error);
      }
    };
    
    // Initialize Supabase buckets
    createSupabaseBuckets();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <SupabaseProvider>
          <AuthProvider>
            <ActivityProvider>
              <NotificationProvider>
                <FileProvider>
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/mfa-verification/:userId" element={<MFAVerification />} />
                    <Route path="/captcha-verification/:userId" element={<CaptchaVerificationPage />} />
                    <Route path='/department-selection/:userId' element={<DepartmentSelection />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/contact-admin" element={<ContactAdmin />} />
                    
                    {/* Protected routes with Layout */}
                    <Route path="/dashboard/:userId" element={<Dashboard />} />
                    <Route path="/dashboard/:userId/:departmentId" element={<Dashboard />} />
                    {/* <Route path="/department" element={<DepartmentSelection />} /> */}
                    <Route path="/files/:userId" element={<Files />} />
                    <Route path="/files/:userId/:departmentId" element={<Files />} />
                    <Route path="/analytics/:userId" element={<Analytics />} />
                    <Route path="/analytics/:userId/:departmentId" element={<Analytics />} />
                    <Route path="/activity/:userId" element={<Activity />} />
                    <Route path="/activity/:userId/:departmentId" element={<Activity />} />
                    <Route path="/users/:userId" element={<Users />} />
                    <Route path="/users/:userId/:departmentId" element={<Users />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/profile/:userId/:departmentId" element={<Profile />} />
                    <Route path="/settings/:userId" element={<Settings />} />
                    <Route path="/settings/:userId/:departmentId" element={<Settings />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </FileProvider>
              </NotificationProvider>
            </ActivityProvider>
          </AuthProvider>
        </SupabaseProvider>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
