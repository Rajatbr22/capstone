import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import CaptchaVerification from '@/components/CaptchaVerification';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/use-supabase';

const CaptchaVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { logActivity } = useActivity();
  const { toast } = useToast();
  const { isLoading } = useSupabase();
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Use a ref to track if initial checks have been performed
  const initialChecksPerformed = useRef(false);

  // useEffect(() => {
  //   // Prevent multiple executions of this effect
  //   if (initialChecksPerformed.current) return;
    
  //   const performInitialChecks = async () => {
  //     // Set the ref to true to prevent future executions
  //     initialChecksPerformed.current = true;
      
  //     // Check if the user is authenticated and has completed MFA
  //     if (!auth.isAuthenticated) {
  //       console.log('User not authenticated, redirecting to login');
  //       navigate('/login', { replace: true });
  //       return;
  //     }

  //     // Check if MFA is verified
  //     if (auth.user?.mfaEnabled && !auth.mfaVerified) {
  //       console.log('MFA not verified, redirecting to MFA verification');
  //       navigate('/mfa-verification', { replace: true });
  //       return;
  //     }

  //     // Check if user has a department_id and redirect to dashboard if they do
  //     // if(auth.user && auth.user.department_id){
  //     //   console.log(auth.user.department_id)
  //     //   console.log('User has department ID, redirecting to dashboard');
  //     //   navigate(`/dashboard/${auth.user.department_id}`, { replace: true });
  //     //   return;
  //     // }
      
  //     // Check if captcha is already verified
  //     const isCaptchaVerified = localStorage.getItem('captchaVerified') === 'true';
  //     if (isCaptchaVerified) {
  //       const verifiedAt = localStorage.getItem('captchaVerifiedAt');

  //       // Check if user has a department_id and redirect to dashboard if they do
  //       if(auth.user && auth.user.department_id){
  //         console.log(auth.user.department_id)
  //         console.log('User has department ID, redirecting to dashboard');
  //         navigate(`/dashboard/${auth.user.id}/${auth.user.department_id}`, { replace: true });
  //         return;
  //       }

  //       if (verifiedAt) {
  //         const verificationTime = new Date(verifiedAt).getTime();
  //         const expirationTime = verificationTime + (60 * 60 * 1000); // 1 hour
  //         if (Date.now() < expirationTime) {
  //           // Already verified within the time window, redirect to dashboard
  //           navigate('/department-selection', { replace: true });
  //           return;
  //         }
  //       }
  //     }
      
  //     // Log page access for security auditing
  //     logActivity('captcha_page_accessed', 'security', 'low');
  //   };
    
  //   performInitialChecks();
    
  // }, [auth.isAuthenticated, auth.mfaVerified, auth.user.mfaEnabled, auth.user?.department_id, navigate]); 

  // const handleCaptchaSuccess = async () => {
  //   logActivity('captcha_verified', 'security', 'low');
    
  //   // Update security metrics in user profile
  //   if (auth.user && auth.user.id) {
  //     try {
  //       // This would normally update a database field
  //       console.log('Updating user security metrics after successful CAPTCHA verification');
  //     } catch (error) {
  //       console.error('Failed to update security metrics:', error);
  //     }
  //   }
    
  //   // Set a flag in localStorage to indicate captcha is verified
  //   localStorage.setItem('captchaVerified', 'true');
  //   localStorage.setItem('captchaVerifiedAt', new Date().toISOString());
    
  //   // Show success toast
  //   toast({
  //     title: "Verification Complete",
  //     description: "Your identity has been verified. Welcome to ZeroSecure AI!",
  //   });
    
  //   // Navigate to dashboard after brief delay to allow seeing the success state
  //   setTimeout(() => {
  //     navigate('/department-selection', { replace: true });
  //   }, 1500);
  // };

  useEffect(() => {
    // Prevent multiple executions of this effect
    if (initialChecksPerformed.current) return;
    
    const performInitialChecks = async () => {
      // Set the ref to true to prevent future executions
      initialChecksPerformed.current = true;
      
      // Check if the user is authenticated and has completed MFA
      if (!auth.isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
  
      // Check if MFA is verified
      if (auth.user?.mfaEnabled && !auth.mfaVerified) {
        console.log('MFA not verified, redirecting to MFA verification');
        navigate(`/mfa-verification/${auth.user.id}`, { replace: true });
        return;
      }
  
      // Check if captcha is already verified
      const isCaptchaVerified = localStorage.getItem('captchaVerified') === 'true';
      if (isCaptchaVerified) {
        const verifiedAt = localStorage.getItem('captchaVerifiedAt');
  
        if (verifiedAt) {
          const verificationTime = new Date(verifiedAt).getTime();
          const expirationTime = verificationTime + (60 * 60 * 1000); // 1 hour
          
          if (Date.now() < expirationTime) {
            // CAPTCHA already verified within the time window
            // Check if user has department_id and redirect accordingly
            if (auth.user && auth.user.department_id) {
              console.log('User has department ID, redirecting directly to dashboard');
              navigate(`/dashboard/${auth.user.id}/${auth.user.department_id}`, { replace: true });
            } else {
              console.log('User has no department ID, redirecting to department selection');
              navigate(`/department-selection/${auth.user.id}`, { replace: true });
            }
            return;
          }
        }
      }
      
      // Log page access for security auditing
      logActivity('captcha_page_accessed', 'security', 'low');
    };
    
    performInitialChecks();
    
  }, [auth.isAuthenticated, auth.mfaVerified, auth.user, navigate]);

  const handleCaptchaSuccess = async () => {
    logActivity('captcha_verified', 'security', 'low');
    
    // Update security metrics in user profile
    if (auth.user && auth.user.id) {
      try {
        // This would normally update a database field
        console.log('Updating user security metrics after successful CAPTCHA verification');
      } catch (error) {
        console.error('Failed to update security metrics:', error);
      }
    }
    
    // Set a flag in localStorage to indicate captcha is verified
    localStorage.setItem('captchaVerified', 'true');
    localStorage.setItem('captchaVerifiedAt', new Date().toISOString());
    
    // Show success toast
    toast({
      title: "Verification Complete",
      description: "Your identity has been verified. Welcome to ZeroSecure AI!",
    });
    
    // After successful CAPTCHA verification, check if user already has a department_id
    if (auth.user && auth.user.department_id) {
      console.log('User already has department ID, redirecting directly to dashboard');
      setTimeout(() => {
        navigate(`/dashboard/${auth.user.id}/${auth.user.department_id}`, { replace: true });
      }, 1500);
    } else {
      // No department_id, redirect to department selection
      setTimeout(() => {
        navigate(`/department-selection/${auth.user.id}`, { replace: true });
      }, 1500);
    }
  };


  const handleCaptchaFailure = async () => {
    logActivity('captcha_blocked', 'security', 'high');
    setIsBlocked(true);
    
    // Update user risk score in the database
    if (auth.user && auth.user.id) {
      try {
        // Normally we would update the risk score in the database here
        console.log('User blocked due to failed CAPTCHA attempts, would update risk score in DB');
      } catch (error) {
        console.error('Failed to update user risk score:', error);
      }
    }
    
    // Log the user out after a brief delay
    setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, 3000);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/80 to-destructive p-4">
        <div className="w-full max-w-md text-white text-center">
          <div className="mb-6">
            <Shield className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Account Blocked</h1>
          <p className="mb-4">
            Your account has been temporarily blocked due to too many failed verification attempts.
          </p>
          <p>
            Please contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center animate-pulse-secure">
            <Shield className="w-8 h-8 text-secure-500" />
          </div>
        </div>
        
        <CaptchaVerification 
          onVerify={handleCaptchaSuccess} 
          onFailure={handleCaptchaFailure}
          maxAttempts={5}
          dashboardPath="/department-selection"
        />
        
        <div className="mt-4 text-center text-white/80 text-sm">
          <div>Zero Trust AI-Powered File Management System</div>
          <div>© {new Date(Date.now()).getFullYear()} ZeroSecure AI</div>
        </div>
      </div>
    </div>
  );
};

export default CaptchaVerificationPage;