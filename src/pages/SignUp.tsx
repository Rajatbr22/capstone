import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActivity } from '@/contexts/ActivityContext';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabaseStatus } from '@/contexts/SupabaseProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Create a schema for form validation
const signUpSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(50, { message: 'Username must be less than 50 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { auth, signUp, loginWithGoogle } = useAuth();
  const { logActivity } = useActivity();
  const { toast } = useToast();
  const { hasError, errorDetails } = useSupabaseStatus();
  const navigate = useNavigate();
  
  // Initialize form with react-hook-form
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Check if user is already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      if (auth.user?.mfaEnabled && !auth.mfaVerified) {
        navigate(`/mfa-verification/${auth.user.id}`);
      } else if (!auth.mfaVerified) {
        navigate(`/mfa-verification/${auth.user.id}`);
      } else if (!localStorage.getItem('captchaVerified')) {
        navigate(`/captcha-verification/${auth.user.id}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [auth.isAuthenticated, auth.mfaVerified, auth.user?.mfaEnabled, navigate]);
  
  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    
    try {
      const success = await signUp(values.username, values.email, values.password);
      
      if (success) {
        logActivity('signup', 'system', 'low');
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. MFA is enabled by default for enhanced security.",
        });
      
        
        if (auth.isAuthenticated) {
          if (auth.user?.mfaEnabled) {
            navigate(`/mfa-verification/${auth.user.id}`);
          } else {
            navigate(`/captcha-verification/${auth.user.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      // Clear previous verification states
      localStorage.removeItem('captchaVerified');
      localStorage.removeItem('mfaVerified');
      
      const success = await loginWithGoogle();
      if (success) {
        logActivity('signup_google', 'system', 'low');
        // The OAuth flow will handle redirection
        toast({
          title: "Redirecting to Google",
          description: "Please wait while we redirect you to Google for authentication"
        });
      }
    } catch (error) {
      console.error("Google signup error:", error);
      toast({
        title: "Sign Up Failed",
        description: "An error occurred during Google sign up",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center animate-pulse-secure">
            <Shield className="w-8 h-8 text-secure-500" />
          </div>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">ZeroSecure AI</CardTitle>
            <CardDescription className="text-center">
              Sign in with Google to access the secure, AI-powered file system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasError && errorDetails && (
              <Alert variant='destructive' className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Supabase Connection Issue</p>
                  <p>{errorDetails}</p>
                  <p className="mt-1">Sign up will work with mock data.</p>
                </AlertDescription>
              </Alert>
            )}
            
            <div className='border dark:bg-black/90 rounded-md shadow-2xl shadow-white/5'>
              <div className='flex flex-col items-center justify-center space-y-8 p-6'>
                <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center animate-pulse-secure">
                  <Shield className="w-12 h-12 text-secure-500" />
                </div>
            
                <div className='font-semibold text-xl'>
                  Sign In / Sign up
                </div>
            
                <div className='text-center'>
                  AI-powered, secure, smart file access system with Zero Trust.
                </div>
            
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading || !isSupabaseConfigured()}
                    title={!isSupabaseConfigured() ? "Supabase configuration required for Google login" : "Sign in with Google"}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    Sign up with Google
                  </Button>

                  <div className="mt-4 text-sm text-center">
                    <p>By signing up, you agree to our <span className='text-blue-500/80 hover:underline cursor-pointer'>Terms of Service</span> and <span className='text-blue-500/80 hover:underline cursor-pointer'>Privacy Policy</span></p>
                  </div>
                </div>
              </div>
            </div>

            {!isSupabaseConfigured() && (
              <div className="mt-2 text-amber-600 text-xs text-center">
                Google sign up requires Supabase configuration
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log In
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-white/80 text-sm">
          <div>Zero Trust AI-Powered File Management System</div>
          <div>© {new Date(Date.now()).getFullYear()} ZeroTrust AI</div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;