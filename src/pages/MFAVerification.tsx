import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/use-supabase';
import { date } from 'zod';

const MFAVerification: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { auth, verifyMfa, sendMfaCode } = useAuth();
  const { logActivity } = useActivity();
  const { isLoading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if user is authenticated
  useEffect(() => {
    console.log('MFA Verification Page: Checking auth status', {
      isAuthenticated: auth.isAuthenticated,
      mfaVerified: auth.mfaVerified,
      mfaEnabled: auth.user?.mfaEnabled
    });
    
    // Check if we're in the middle of a verification->redirect process
    const isRedirecting = localStorage.getItem('mfaRedirecting');
    if (isRedirecting === 'true') {
      return; // Skip the effect if we're already redirecting
    }
  
    if (!auth.isAuthenticated) {
      // Not logged in, redirect to login
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
  
    // Check this condition first - if MFA is already verified, redirect to CAPTCHA
    if (auth.isAuthenticated && auth.mfaVerified) {
      // Set redirecting flag to prevent loops
      localStorage.setItem('mfaRedirecting', 'true');
      
      // MFA already verified, redirect to CAPTCHA
      console.log('MFA already verified, redirecting to CAPTCHA verification');
      navigate(`/captcha-verification/${auth.user.id}`, { replace: true });
      return;
    }
  
    // If user is authenticated but MFA not verified, stay on this page
    if (auth.isAuthenticated && !auth.mfaVerified && auth.user?.mfaEnabled) {
      // Check if we need to auto-send a code
      const shouldAutoSend = !localStorage.getItem('mfaCodeSent');
      
      if (shouldAutoSend && auth.user?.email) {
        console.log('Auto-sending MFA code');
        localStorage.setItem('mfaCodeSent', 'true');
        sendMfaCode(auth.user.email)
          .then(success => {
            if (success) {
              toast({
                title: "Verification Code Sent",
                description: `A verification code has been sent to ${auth.user?.email}`
              });
              logActivity('mfa_code_sent', 'security', 'low');
            }
          })
          .catch(error => {
            console.error('Error auto-sending MFA code:', error);
            logActivity('mfa_code_send_error', 'security', 'medium');
          });
      }
    }
  }, [auth.isAuthenticated, auth.mfaVerified, auth.user, navigate, sendMfaCode, toast]);
  
  // Clear redirect flag when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('mfaRedirecting');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const success = await verifyMfa(verificationCode);
      // console.log('success...', success)
      if (success) {;
        localStorage.setItem('mfaVerified', 'true');
        logActivity('mfa_verification_success', 'security', 'low');
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified. Proceeding to CAPTCHA verification."
        });
        
        // Add a small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate(`/captcha-verification/${auth.user.id}`, { replace: true });
        }, 300);
      } else {
        setError('Invalid verification code. Please try again.');
        logActivity('mfa_verification_failed', 'security', 'medium');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setError('An error occurred during verification. Please try again.');
      logActivity('mfa_verification_error', 'security', 'high');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);

    try {
      if (auth.user?.email) {
        localStorage.setItem('mfaCodeSent', 'true');
        const success = await sendMfaCode(auth.user.email);
        if (success) {
          toast({
            title: "Code Sent",
            description: `A new verification code has been sent to ${auth.user.email}`
          });
          logActivity('mfa_code_resent', 'security', 'low');
        } else {
          setError('Failed to send a new verification code. Please try again.');
          logActivity('mfa_code_resend_failed', 'security', 'medium');
        }
      } else {
        setError('Could not determine email address for sending code.');
        logActivity('mfa_code_resend_failed', 'security', 'medium');
      }
    } catch (error) {
      console.error('Error resending MFA code:', error);
      setError('An error occurred while sending a new code. Please try again.');
      logActivity('mfa_code_resend_error', 'security', 'high');
    } finally {
      setIsResending(false);
    }
  };

  // For development purposes, show the OTP code in the console
  useEffect(() => {
    const storedOTP = localStorage.getItem('currentOTP');
    if (storedOTP) {
      console.log('Current OTP for testing:', storedOTP);
    }
  }, []);

  // Add a check to make sure the auth object and user are properly loaded
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading authentication details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 text-black bg-white animate-pulse-secure rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-secure-500" />
          </div>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Multi-Factor Authentication</CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, i) => (
                          <InputOTPSlot key={i} data-index={i} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Please enter the 6-digit code
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !verificationCode || verificationCode.length !== 6}
                >
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </CardContent>
          {/* <CardFooter>
            <div className="w-full text-center">
              <Button
                variant="link"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm"
              >
                {isResending ? "Sending..." : "Resend verification code"}
              </Button>
            </div>
          </CardFooter> */}

          <CardFooter className='justify-center'>
            <div className='text-sm text-center text-muted-foreground'>
              Didn't  receive a code?{" "}
              <button
                type='button'
                className='text-primary underline hover:no-underline'
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? "Sending..." : 'Resend verification code'}
              </button>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-white/80 text-sm">
          <div>Zero Trust AI-Powered File Management System</div>
          <div>© {new Date(Date.now()).getFullYear()} ZeroSecure AI</div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;