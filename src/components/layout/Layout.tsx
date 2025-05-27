import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Role, SessionInfo } from '@/types';
import { Progress } from '@/components/ui/progress';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: Role;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  requireAuth = true,
  requiredRole = 'guest'
}) => {
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [sessionProgress, setSessionProgress] = useState(100);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  
  let auth = { isAuthenticated: false, mfaVerified: false, user: null, sessionExpiry: null };
  let checkAccess = (role: Role) => false;
  
  try {
    const authContext = useAuth();
    auth = authContext.auth;
    checkAccess = authContext.checkAccess;
  } catch (error) {
    console.error("Layout: Auth context not available:", error);
  }
  
  // Initialize session info when user logs in
  useEffect(() => {
    if (auth.isAuthenticated && auth.sessionExpiry) {
      // Create session info with 30-minute expiry

      const getMaxInactiveTime = () => {
        let maxTime = 30 * 60 * 1000; 
        if (auth.user?.role === 'admin') {
          maxTime = 60 * 60 * 1000; // 60 minutes for admins
        } else if (auth.user?.role === 'department_head') {
          maxTime = 45 * 60 * 1000; // 45 minutes for managers
        } else if (auth.user?.role === 'employee') {
          maxTime = 30 * 60 * 1000; // 30 minutes for basic users
        } else if (auth.user?.role === 'guest') {
          maxTime = 15 * 60 * 1000; // 15 minutes for basic users
        }
        
        return maxTime;
      };

      const sessionExpiryTime = auth.sessionExpiry;
      const lastActivity = new Date();
      const maxInactiveTime = getMaxInactiveTime()


      
      setSessionInfo({
        expiresAt: sessionExpiryTime,
        lastActivity,
        maxInactiveTime,
      });
    } else {
      setSessionInfo(null);
    }
  }, [auth.isAuthenticated, auth.sessionExpiry]);
  
  // Update session progress bar and time left
  useEffect(() => {
    if (!sessionInfo || !auth.isAuthenticated) return;
    
    const updateProgress = () => {
      const now = new Date();
      const expiresAt = new Date(sessionInfo.expiresAt);
      const totalSessionTime = sessionInfo.maxInactiveTime;
      const timeLeftMs = expiresAt.getTime() - now.getTime();
      
      // Calculate minutes and seconds left
      const minutes = Math.floor(Math.max(0, timeLeftMs) / 60000);
      const seconds = Math.floor((Math.max(0, timeLeftMs) % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
      
      // Calculate progress percentage (100% to 0%)
      const newProgress = Math.max(0, Math.min(100, (timeLeftMs / totalSessionTime) * 100));
      setSessionProgress(newProgress);
      
      // Redirect to login when session expires
      if (timeLeftMs <= 0) {
        // sessionStorage.clear();
        // localStorage.clear();
        navigate('/login', { replace: true });
      }
    };
    
    // Update progress initially
    updateProgress();
    
    // Set up interval to update progress every second for smoother updates
    const interval = setInterval(updateProgress, 1000);
    
    // Reset lastActivity on user interaction
    const resetActivity = () => {
      if (sessionInfo) {
        const newExpiresAt = new Date(Date.now() + sessionInfo.maxInactiveTime);
        setSessionInfo({
          ...sessionInfo,
          lastActivity: new Date(),
          expiresAt: newExpiresAt,
        });
        
        // Immediately update the progress after resetting the activity
        const timeLeftMs = newExpiresAt.getTime() - Date.now();
        const minutes = Math.floor(Math.max(0, timeLeftMs) / 60000);
        const seconds = Math.floor((Math.max(0, timeLeftMs) % 60000) / 1000);
        setTimeLeft({ minutes, seconds });
        
        const newProgress = Math.max(0, Math.min(100, (timeLeftMs / sessionInfo.maxInactiveTime) * 100));
        setSessionProgress(newProgress);
      }
    };
    
    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetActivity));
    
    return () => {
      clearInterval(interval);
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [sessionInfo, auth.isAuthenticated, navigate]);
  
  // Handle authentication and authorization checks
  useEffect(() => {
    const checkAuthAndAccess = () => {
      // Check localStorage for MFA verification status
      const mfaVerifiedInStorage = 'true';
      
      console.log('Layout: Checking auth and access', {
        requireAuth,
        isAuthenticated: auth.isAuthenticated,
        mfaVerified: auth.mfaVerified,
        mfaVerifiedInStorage,
        mfaEnabled: auth.user?.mfaEnabled,
        role: auth.user?.role
      });
      
      // If authentication is required but user is not authenticated, redirect to login
      if (requireAuth && !auth.isAuthenticated) {
        console.log('Layout: User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      
      // If MFA is required but not verified, redirect to MFA verification
      // Check both the auth context AND localStorage to be extra safe
      // if (requireAuth && auth.isAuthenticated && !mfaVerifiedInStorage && auth.user?.mfaEnabled) {
      //   console.log('Layout: MFA not verified, redirecting to MFA verification');
      //   navigate('/mfa-verification', { replace: true });
      //   return;
      // }
      
      // If role check fails, redirect to unauthorized page
      // if (requireAuth && auth.isAuthenticated && !checkAccess(requiredRole)) {
      //   console.log('Layout: Insufficient permissions, redirecting to unauthorized');
      //   navigate('/unauthorized', { replace: true });
      //   return;
      // }
      
      // Auth check complete - user is authenticated and authorized
      setAuthCheckComplete(true);
    };
    
    // Add a small delay to ensure auth context is fully updated
    // This helps prevent redirect loops by giving time for MFA status to sync
    const timer = setTimeout(checkAuthAndAccess, 200);
    return () => clearTimeout(timer);
    
  }, [requireAuth, auth, checkAccess, requiredRole, navigate]);
  
  // While checking authentication, show loading state
  if (requireAuth && !authCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }
  
  // If the page requires auth and the user is not authenticated, show nothing while redirecting
  if (requireAuth && !auth.isAuthenticated) {
    return null;
  }
  
  // If MFA is required but not verified, show nothing while redirecting
  if (requireAuth && auth.isAuthenticated && !auth.mfaVerified && auth.user?.mfaEnabled) {
    // Double check with localStorage
    const mfaVerifiedInStorage = localStorage.getItem('mfaVerified') === 'true';
    if (!mfaVerifiedInStorage) {
      return null;
    }
  }
  
  // If the user doesn't have the required role, show nothing while redirecting
  if (requireAuth && auth.isAuthenticated && auth.mfaVerified && !checkAccess(requiredRole)) {
    return null;
  }
  
  // Format time left for display
  const formattedTimeLeft = `${timeLeft.minutes}:${timeLeft.seconds.toString().padStart(2, '0')}`;
  
  // Render the layout once all checks pass
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {auth.isAuthenticated && (
        <Sidebar />
      )}
      {/* <div className="flex-1 flex flex-col">
        {auth.isAuthenticated && (
          <>
            <TopBar />
            {sessionInfo && (
              <div className="px-4 py-1 bg-muted/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Session</span>
                  <span>
                    {sessionProgress > 25 ? `Active (${formattedTimeLeft})` : `Expiring soon (${formattedTimeLeft})`}
                  </span>
                </div>
                <Progress 
                  value={sessionProgress} 
                  className={`h-1 ${
                    sessionProgress > 50 ? 'bg-primary/20' : 
                    sessionProgress > 25 ? 'bg-yellow-500/20' : 
                    'bg-red-500/20'
                  }`}
                  indicatorClassName={
                    sessionProgress > 50 ? 'bg-primary' : 
                    sessionProgress > 25 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }
                />
              </div>
            )}
          </>
        )}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div> */}
    </div>
  );
};

export default Layout;