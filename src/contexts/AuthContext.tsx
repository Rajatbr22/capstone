import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthState, User, Role } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { setExpiryBasedOnRole } from '@/lib/expiryTime'

// API configuration
const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyMfa: (code: string) => Promise<boolean>;
  checkAccess: (requiredRole: Role) => boolean;
  refreshSession: () => Promise<void>;
  isSessionExpired: () => boolean;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  sendMfaCode: (email: string) => Promise<boolean>;
  isCaptchaVerified: () => boolean;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  mfaVerified: false,
  sessionExpiry: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem('token')
  // console.log('token received: ', token)

  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Authentication failed');
  }
  
  return response.json();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [auth, setAuth] = useState<AuthState>(() => {
    // Check if we have session data in localStorage
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        // Convert string dates back to Date objects
        if (parsed.sessionExpiry) {
          parsed.sessionExpiry = new Date(parsed.sessionExpiry);
        }
        if (parsed.user?.lastLogin) {
          parsed.user.lastLogin = new Date(parsed.user.lastLogin);
        }
        
        // Check if session is still valid
        if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) > new Date()) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing auth from localStorage', e);
      }
    }
    return initialAuthState;
  });

  const navigate = useNavigate();

  // Check if CAPTCHA is verified
  const isCaptchaVerified = (): boolean => {
    return localStorage.getItem('captchaVerified') === 'true';
  };

  useEffect(() => {
    const checkSession = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No auth token found, skipping session check');
        return;
      }else{
        console.log('session is active...')
      }
  
      try {
        const data = await fetchWithAuth('/auth/validate-session', { method: 'GET' });
        
        if (data.valid) {
          // setupUserSession(data.user);
          setAuth(prevAuth => {
            const updatedAuth = {
              isAuthenticated: true,
              user: {
                id: data.user.id,
                username: data.user.email.split("@")[0],
                email: data.user.email,
                role: data.user.role,
                mfaEnabled: data.user.mfaEnabled || true,
                riskScore: 0.1,
                department_id: data.user.departmentId,
                departmentName: data.user.departmentName,
                failed_login_attempts: 0,
                account_locked: false,
              },
              // Preserve existing MFA status rather than resetting it
              mfaVerified: prevAuth.mfaVerified || !data.user.mfaEnabled,
              sessionExpiry: prevAuth.sessionExpiry || data.user.expiryTimestamp,
            };
            
            // Ensure we update localStorage
            localStorage.setItem('auth', JSON.stringify(updatedAuth));
            
            return updatedAuth;
          });
          if (data.user.mfaEnabled && !auth.mfaVerified) {
            navigate(`/mfa-verification/${auth.user.id}`);
          }
        } else {
          setTimeout(() => {
            toast({
              title: "Logged Out",
              description: "You have been logged out successfully",
              duration: 1000,
            });
            logout();
          }, 1000);
        }
      } catch (err) {
        console.error('Error validating session:', err);
      }
    };
  
    checkSession();
  },[]);
  
  
  // Check for session expiry
  useEffect(() => {
    if (auth.isAuthenticated && auth.sessionExpiry) {
      const checkInterval = setInterval(() => {
        if (isSessionExpired()) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          logout();
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(checkInterval);
    }
  }, [auth.isAuthenticated, auth.sessionExpiry]);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem('auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('auth');
    }
  }, [auth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          handleAuthStateChange();
        } else if (event === 'SIGNED_OUT') {
          setupUserSession(null)
        }
      }
    );
    
    handleAuthStateChange();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update the setupUserSession function to preserve MFA status
  const setupUserSession = (userData: any) => {
    setAuth(prevAuth => {
      const user: User = {
        id: userData.id,
        username: userData.email.split("@")[0],
        email: userData.email,
        role: userData.role,
        mfaEnabled: userData.mfaEnabled || true,
        riskScore: 0.1,
        department_id: userData.departmentId, 
        departmentName: userData.departmentName,
        failed_login_attempts: 0,
        account_locked: false,
      };
      
      // Set session expiry
      // const expiryTime = userData.session
      // Preserve MFA status when possible
      const mfaVerified = prevAuth.mfaVerified || !user.mfaEnabled;
      const expiresAt = prevAuth.sessionExpiry
      
      return {
        isAuthenticated: true,
        user,
        mfaVerified,
        sessionExpiry: expiresAt,
      };
    });
  };

  const isSessionExpired = () => {
    if (!auth.sessionExpiry) return true;
    return new Date() > auth.sessionExpiry;
  };

  const refreshSession = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token, cannot refresh session');
        return;
      }
      
      const data = await fetchWithAuth('/auth/refresh-token', { method: 'POST' });
      
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        if (data.user) {
          setupUserSession(data.user);
        }
        
        // Reset session expiry
        // const expiryTime = setExpiryBasedOnRole(data.user.role)
        
        setAuth(prev => ({
          ...prev,
        }));
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    localStorage.clear();
    
    if (!email || !password) {
      toast({
        title: "Login Failed",
        description: "Email and password cannot be empty",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });
      
      const data = await response.json();
      // console.log('userData: ', data);
      
      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
        throw new Error(data.message || 'Failed to login');
      }

      // Ensure data contains necessary fields before proceeding
      if (!data || !data.user || !data.user._id) {
        toast({
          title: "Login Issue",
          description: "Authentication successful but user data not received properly",
          variant: "destructive",
        });
        console.error('Received incomplete user data: ', data);
        return false;
      }

      // Log user data for debugging
      console.log('Received user data: ', data.user);
      
      // if (data.token) {
      //   localStorage.setItem("token", data.token);
      //   console.log('login-token', data.token);
      // }
      
      if (data.token) {
        // Save token in localStorage

        // localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token)
        console.log('Saved authToken:', data.token);
      
        // Optionally: Also set token in a global state / context if you use React Context/Redux
        // Example: setAuthToken(data.token);
      } else {
        console.error('Token not found in response');
      }

      setupUserSession(data.user);
      
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully!",
      });
      
      // Check if MFA is enabled
      if (data.mfaEnabled) {
        await sendMfaCode(data.email);
        navigate(`/mfa-verification/${auth.user.id}`);
      }
      return true;
      
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      return false;
    }
};

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      localStorage.clear()
      sessionStorage.clear()
  
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, cannot use Google login');
        toast({
          title: "Google Sign-in Unavailable",
          description: "Google sign-in requires Supabase configuration.",
          variant: "destructive",
        });
        return false;
      }
  
      // 1. Start OAuth sign-in (this will redirect automatically)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
  
      if (signInError) {
        console.error('Sign-in error:', signInError.message);
        toast({
          title: "Google Sign-in Failed",
          description: signInError.message || "An error occurred during Google sign-in",
          variant: "destructive",
        });
        return false;
      }
      return true;
  
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      toast({
        title: "Google Sign-in Failed",
        description: "An unexpected error occurred during sign-in",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleAuthStateChange = async () => {
    try {
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth state:', error.message);
        return;
      }
      

      if (session) {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData || !userData.user) {
          console.error('No user data available');
          return;
        }
        
        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userEmail.split('@')[0];
                      
        if (!userEmail) {
          console.error('Email not found in Google account');
          return;
        }
        
        // Send data to your backend
        const response = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: userEmail,
            username: userName
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          toast({
            title: "Login Failed",
            description: data.message || "Invalid credentials",
            variant: "destructive",
          });
          throw new Error(data.message || 'Failed to login');
        }
  
        // Ensure data contains necessary fields before proceeding
        if (!data || !data.user || !data.user._id) {
          toast({
            title: "Login Issue",
            description: "Authentication successful but user data not received properly",
            variant: "destructive",
          });
          console.error('Received incomplete user data: ', data);
          return false;
        }
  
        // Log user data for debugging
        console.log('Received user data: ', data.user);
        
        if (data.token) {
          sessionStorage.setItem('token', data.token)
          console.log('Saved authToken:', data.token);
        
        } else {
          console.error('Token not found in response');
        }
  
        setupUserSession(data.user);
        
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully!",
        });
        
        // Check if MFA is enabled
        if (data.mfaEnabled) {
          await sendMfaCode(data.email);
          navigate(`/mfa-verification/${auth.user.id}`);
        }
      }
    } catch (error) {
      console.error('Error in auth state handler:', error);
      toast({
        title: "Authentication Error",
        description: "An error occurred during authentication",
        variant: "destructive",
      });
    }
  };

  const signUp = async (username: string, email: string, password: string): Promise<boolean> => {
    // Basic validation
    if (!username || !email || !password) {
      toast({
        title: "Registration Failed",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });
      
      const data = await response.json();
      // console.log(data)
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      
      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully! Please check your email for verification.",
        });
        
        // If backend auto-logs in user
        if (data.accessToken) {
          console.log(data.accessToken)
          sessionStorage.setItem('token', data.accessToken);
          setupUserSession(data.user);
          
          // If MFA is required
          if (data.user.mfaEnabled) {
            console.log(data.user.mfaEnabled)
            await sendMfaCode(email);
            navigate(`/mfa-verification${auth.user.id}`);
          }
        } else {
          navigate('/login');
        }
        
        return true;
      } else {
        toast({
          title: "Registration Failed",
          description: data?.error || "An error occurred during registration",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error during signup:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendMfaCode = async (email: string): Promise<boolean> => {
    try {

      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No auth token, cannot refresh session');
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('currentOTP', otp);
      console.log('OTP code for testing:', otp);
            
      // toast({
      //   title: "OTP Code Sent",
      //   description: `A verification code has been sent to ${email}`,
      // });

      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: email,
          otp: otp
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send MFA code');
      }
      
      if (data.success) {
        toast({
          title: "OTP Code Sent",
          description: `A verification code has been sent to ${email}`,
        });
        
        // For development, store OTP locally if provided in response
        // if (data.devOtp) {
        //   localStorage.setItem('currentOTP', data.devOtp);
        //   console.log('OTP code for testing:', data.devOtp);
        // }
        
        return true;
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.message || "Could not send verification code",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending MFA code:', error);
      toast({
        title: "Failed to Send Code",
        description: "An error occurred while sending the verification code",
        variant: "destructive",
      });
      return false;
    }
  };

  const verifyMfa = async (code: string): Promise<boolean> => {
    
    const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No auth token, cannot refresh session');
        return;
      }
      
    try {
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        toast({
          title: "Verification Failed",
          description: "Invalid verification code. Must be 6 digits.",
          variant: "destructive",
        });
        return false;
      }
      
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`

        },
        body: JSON.stringify({ 
          email: auth.user?.email,
          otp: code,
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify MFA');
      }
      
      if (data.success) {
        // Mark MFA as verified
        setAuth(prev => ({
          ...prev,
          mfaVerified: true,
        }));
        
        // Clean up OTP if stored locally
        localStorage.removeItem('currentOTP');
        
        // Update token if a new one is provided
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        toast({
          title: "Verification Successful",
          description: "MFA verification completed successfully",
        });
        
        return true;
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
      return false;
    }

    // try {
    //         if (code.length !== 6 || !/^\d+$/.test(code)) {
    //           toast({
    //             title: "Verification Failed",
    //             description: "Invalid verification code. Must be 6 digits.",
    //             variant: "destructive",
    //           });
    //           return false;
    //         }
            
    //         // For testing purposes, check against localStorage OTP
    //         const storedOTP = localStorage.getItem('currentOTP');
            
    //         // For development, allow any 6-digit code if no stored OTP
    //         if (storedOTP && storedOTP !== code) {
    //           toast({
    //             title: "Verification Failed",
    //             description: "Invalid verification code.",
    //             variant: "destructive",
    //           });
    //           return false;
    //         }
            
    //         // Mark MFA as verified
    //         // setAuth(prev => ({
    //         //   ...prev,
    //         //   mfaVerified: true,
    //         // }));

    //         setAuth((prev) => {
    //           const updatedAuth = {
    //             ...prev,
    //             mfaVerified: true,
    //           };
              
    //           // Immediately save to localStorage to ensure persistence
    //           localStorage.setItem('auth', JSON.stringify(updatedAuth));
              
    //           return updatedAuth;
    //         });
            
    //         // Clean up OTP
    //         localStorage.removeItem('currentOTP');
    //         toast({
    //           title: "Verification Successful",
    //           description: "MFA verification completed successfully",
    //         })
    //         // Let the component handle navigation
    //         return true;
    //       } catch (error) {
    //         console.error('Error verifying MFA:', error);
    //         toast({
    //           title: "Verification Failed",
    //           description: "An error occurred during verification",
    //           variant: "destructive",
    //         });
    //         return false;
    //       }
  };

  const resendOtp = async (email: string) => {
    try {

      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No auth token, cannot refresh session');
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('currentOTP', otp);
      console.log('resend otp for testing:', otp);


      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: email,
          otp: otp
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send MFA code');
      }
      
      if (data.success) {
        toast({
          title: "OTP Code Resent",
          description: `A new verification code has been sent to ${email}`,
        });
        
        // For development, store OTP locally if provided in response
        // if (data.devOtp) {
        //   localStorage.setItem('currentOTP', data.devOtp);
        //   console.log('OTP code for testing:', data.devOtp);
        // }
        
        return true;
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.message || "Could not send verification code",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending MFA code:', error);
      toast({
        title: "Failed to Send Code",
        description: "An error occurred while sending the verification code",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Notify backend about logout
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          await fetch(`${API_URL}/auth/signout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.log('Error during backend logout:', err);
        }
      }
      
      // Clear all localStorage items
      sessionStorage.clear()
      localStorage.clear();
      
      // Reset local auth state
      setAuth(initialAuthState);
      
      setTimeout(() => {
        toast({
          title: "Logged Out",
          description: "You have been logged out successfully",
          duration: 1000,
        });
        navigate('/login')
      }, 1000);
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if there's an error with backend, reset the local state
      sessionStorage.clear()
      localStorage.clear();
      setAuth(initialAuthState);
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      
      navigate('/login');
    }
  };

  const checkAccess = (requiredRole: Role): boolean => {
    if (!auth.isAuthenticated || !auth.mfaVerified || !auth.user || !isCaptchaVerified()) {
      return false;
    }
    
    // Role hierarchy: admin > manager > user > guest
    const roleHierarchy: Record<Role, number> = {
      'admin': 4,
      'department_head': 3,
      'employee': 2,
      'guest': 1
    };
    
    return roleHierarchy[auth.user.role] >= roleHierarchy[requiredRole];
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!auth.isAuthenticated || !auth.user) {
        console.error('Cannot update profile: User not authenticated');
        return false;
      }
      
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      if (data.success) {
        // Update local state with the updated user data
        setAuth(prev => ({
          ...prev,
          user: {
            ...prev.user!,
            ...data.user // Use the data returned from backend
          }
        }));
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully",
        });
        
        return true;
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      auth,
      login,
      loginWithGoogle,
      signUp,
      logout,
      verifyMfa,
      checkAccess,
      refreshSession,
      isSessionExpired,
      updateUserProfile,
      sendMfaCode,
      isCaptchaVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};