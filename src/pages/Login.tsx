import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivity } from '@/contexts/ActivityContext';
import { Separator } from '@/components/ui/separator';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStatus } from '@/contexts/SupabaseProvider';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { auth, login, loginWithGoogle, isCaptchaVerified } = useAuth();
  const { logActivity } = useActivity();
  const { toast } = useToast();
  const { hasError, errorDetails } = useSupabaseStatus();
  const navigate = useNavigate();
  

  useEffect(() => {
    localStorage.clear()
    
    // If Supabase is configured, check session status
    if (isSupabaseConfigured()) {
      const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Active Supabase session found');
        }
      };
      
      checkSession();
    }
    
    if (auth.isAuthenticated) {
      console.log('Login: User already authenticated, MFA status =', auth.mfaVerified);
      

      if (auth.user?.mfaEnabled && !auth.mfaVerified) {
        navigate(`/mfa-verification/${auth.user.id}`, { replace: true });
      } 
      // else if (!isCaptchaVerified()) {
      //   navigate(`/captcha-verification/${userId}`, { replace: true });
      // } else {
      //   navigate('/dashboard', { replace: true });
      // }
    }
  }, [auth.isAuthenticated, auth.mfaVerified, auth.user?.mfaEnabled, navigate, auth]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Clear previous verification states
      localStorage.clear()
      
      const success = await login(email, password);
      
      if (success) {
        logActivity('login', 'system', 'low');
        console.log('Login successful, checking MFA status');
        

        setTimeout(() => {
          if (auth.isAuthenticated) {

            if (auth.user?.mfaEnabled) {
              console.log('Login: Redirecting to MFA verification', auth.user.id);
              navigate(`/mfa-verification/${auth.user.id}`, { replace: true });
            }
          }
        }, 300);
      }
    } catch (error) {
      console.error('Login error:', error);
      logActivity('login_failed', 'security', 'medium');
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        logActivity('login_google', 'system', 'low');
        // The navigation will be handled by the OAuth flow and AuthContext
        toast({
          title: "Redirecting to Google",
          description: "Please wait while we redirect you to Google for authentication"
        });
      }
    } catch (error) {
      console.error("Google login error:", error);
      logActivity('login_google_failed', 'security', 'medium');
      toast({
        title: "Login Failed",
        description: "An error occurred during Google login",
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
              Enter your credentials to access the secure platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasError && errorDetails && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-amber-800 text-sm">
                <p className="font-medium">Supabase Connection Issue</p>
                <p>{errorDetails}</p>
                {errorDetails.includes('recursion') && (
                  <p className="mt-1 font-semibold">Please run the updated SQL schema in your Supabase project.</p>
                )}
                <p className="mt-1">Login will work with mock data.</p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Log In"}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
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
              Sign in with Google
            </Button>
            {!isSupabaseConfigured() && (
              <div className="mt-2 text-amber-600 text-xs text-center">
                Google login requires Supabase configuration
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign Up
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

export default Login;
