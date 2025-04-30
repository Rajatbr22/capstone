
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useSupabaseStatus } from '@/contexts/SupabaseProvider';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { auth, refreshSession } = useAuth();
  const { isInitialized, hasError } = useSupabaseStatus();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for any auth hash in the URL (from OAuth redirects)
    const checkOAuthRedirect = async () => {
      try {
        setIsProcessingOAuth(true);
        console.log('Index: Checking for OAuth redirect');
        
        // Skip OAuth processing if Supabase isn't configured properly
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, skipping OAuth check');
          setIsProcessingOAuth(false);
          return;
        }
        
        // This will process any OAuth redirects if they exist
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session on redirect:', error);
          setOauthError("There was a problem with your login. Please try again.");
          toast({
            title: "Authentication Error",
            description: "There was a problem with your login. Please try again.",
            variant: "destructive",
          });
        }
        
        // If we have a session, refresh our auth context
        if (data.session) {
          console.log('Session found during OAuth check, refreshing');
          
          try {
            await refreshSession();
            
            // Check MFA status from localStorage - this is important for persistence
            const mfaVerifiedInStorage = localStorage.getItem('mfaVerified') === 'true';
            
            // After successful session refresh, navigate to appropriate page
            if (auth.isAuthenticated) {
              // Determine where to navigate based on MFA status
              const needsMfa = auth.user?.mfaEnabled && !mfaVerifiedInStorage;
              console.log('Index: After session refresh, needsMfa =', needsMfa);
              
              if (needsMfa) {
                navigate(`/mfa-verification/${auth.user.id}`, { replace: true });
              } else {
                // If MFA is verified, update the status in auth context
                if (mfaVerifiedInStorage) {
                  // No need to wait for this update, just fire and proceed to dashboard
                  console.log('Index: MFA verified in storage, updating auth context');
                }
                
                navigate('/dashboard', { replace: true });
              }
            }
          } catch (refreshError) {
            console.error('Error during session refresh:', refreshError);
            
            // Check if this is due to a policy error
            if (refreshError instanceof Error && refreshError.message?.includes('recursion')) {
              setOauthError("Database policy error detected. You need to run the updated SQL schema in Supabase.");
              toast({
                title: "Database Schema Error",
                description: "Please run the updated SQL schema from src/lib/supabase-schema.sql in your Supabase SQL Editor.",
                variant: "destructive",
                duration: 10000,
              });
            } else {
              setOauthError("Error during authentication. Please try again or contact support.");
              toast({
                title: "Authentication Error",
                description: "Error refreshing your session. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('Error during OAuth processing:', error);
        setOauthError("An unexpected error occurred during login.");
      } finally {
        setIsProcessingOAuth(false);
      }
    };
    
    if (isInitialized) {
      checkOAuthRedirect();
    }
  }, [refreshSession, isInitialized, navigate, auth.isAuthenticated, toast]);
  
  useEffect(() => {
    // Only redirect after OAuth processing is complete and Supabase is initialized
    if (!isProcessingOAuth && isInitialized) {
      console.log('Index: Ready to redirect, isAuthenticated =', auth.isAuthenticated);
      console.log('Index: User =', auth.user);
      console.log('Index: MFA status =', auth.mfaVerified);
      
      if (auth.isAuthenticated) {
        // Check if MFA verification is needed
        const mfaVerifiedInStorage = localStorage.getItem('mfaVerified') === 'true';
        const needsMfa = auth.user?.mfaEnabled && !mfaVerifiedInStorage;
        console.log('Index: Needs MFA =', needsMfa);
        console.log('Index: MFA verified in storage =', mfaVerifiedInStorage);
        
        if (needsMfa) {
          console.log('Index: Redirecting to MFA verification');
          navigate(`/mfa-verification/${auth.user.id}`, { replace: true });
        } else {
          console.log('Index: Redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          
          // Welcome message for returning users
          if (auth.user?.username) {
            toast({
              title: "Welcome Back",
              description: `Logged in as ${auth.user.username}`,
            });
          }
        }
      } else {
        console.log('User is not authenticated, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [isProcessingOAuth, navigate, auth.isAuthenticated, auth.mfaVerified, auth.user, isInitialized, toast]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700">
      <div className="text-white text-center max-w-md p-6">
        <h1 className="text-3xl font-bold mb-2">Loading...</h1>
        <p className="mb-4">Redirecting you to the appropriate page</p>
        
        {oauthError && (
          <div className="bg-red-900/40 border border-red-700 p-4 rounded-md mt-4 text-white">
            <p className="font-medium">Authentication Error</p>
            <p>{oauthError}</p>
            <p className="mt-2 text-sm">
              If you're seeing database policy errors, please run the updated SQL schema in your Supabase project.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-white font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
        
        {hasError && (
          <div className="bg-amber-900/40 border border-amber-700 p-4 rounded-md mt-4 text-white">
            <p className="font-medium">Supabase Connection Issue</p>
            <p>The application will function with limited capabilities using mock data.</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-white font-medium transition-colors"
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
