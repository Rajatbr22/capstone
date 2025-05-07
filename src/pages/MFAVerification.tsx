import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';

const MFAVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { auth, verifyMfa, sendMfaCode } = useAuth();
  const { logActivity } = useActivity();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Check authentication status and handle redirects
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

    if (auth.user?.account_locked) {
      toast({
        title: 'Account Access Restricted',
        description: 'Your account has been temporarily blocked. Please contact the administrator at admin@gmail.com for assistance.',
        variant: 'destructive',
        duration: 5000,
      });
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
        handleSendCode();
      }
    }
  }, [auth.isAuthenticated, auth.mfaVerified, auth.user]);
  
  // Clear redirect flag when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('mfaRedirecting');
    };
  }, []);

  // Handle OTP timer
  useEffect(() => {
    // Check if there's a valid OTP timestamp in localStorage
    const otpTimestamp = localStorage.getItem('otpTimestamp');
    
    if (otpTimestamp) {
      const expiryTime = parseInt(otpTimestamp) + (60 * 1000); // 60 seconds from sent time
      const now = Date.now();
      
      if (now < expiryTime) {
        // OTP is still valid, calculate remaining time
        const remaining = Math.floor((expiryTime - now) / 1000);
        setTimeLeft(remaining);
        setIsExpired(false);
        
        // Start the countdown
        const timer = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearInterval(timer);
              setIsExpired(true);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      } else {
        // OTP has expired
        setIsExpired(true);
        setTimeLeft(0);
      }
    }
  }, [isResending]);
  
  // For development purposes, show the OTP code in the console
  useEffect(() => {
    const storedOTP = localStorage.getItem('currentOTP');
    if (storedOTP) {
      console.log('Current OTP for testing:', storedOTP);
    }
  }, [timeLeft]);

  const handleSendCode = async () => {
    if (!auth.user?.email) {
      setError('Could not determine email address for sending code.');
      // logActivity('mfa_code_send_failed', 'security', 'medium');
      return false;
    }
    
    setIsResending(true);
    setError(null);
    
    try {
      localStorage.setItem('mfaCodeSent', 'true');
      const success = await sendMfaCode(auth.user.email);
      
      if (success) {
        // Set the timestamp when the OTP was sent
        localStorage.setItem('otpTimestamp', Date.now().toString());
        setIsExpired(false);
        
        toast({
          title: "Verification Code Sent",
          description: `A verification code has been sent to ${auth.user.email}`
        });
        // logActivity('mfa_code_sent', 'security', 'low');
        return true;
      } else {
        setError('Failed to send verification code. Please try again.');
        // logActivity('mfa_code_send_failed', 'security', 'medium');
        return false;
      }
    } catch (error) {
      console.error('Error sending MFA code:', error);
      setError('An error occurred while sending the code. Please try again.');
      // logActivity('mfa_code_send_error', 'security', 'high');
      return false;
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    
    // Check if code is expired
    if (isExpired) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const success = await verifyMfa(verificationCode);
      if (success) {
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
      // logActivity('mfa_verification_error', 'security', 'high');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  // Loading state
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
                  onChange={setVerificationCode}>
                  <InputOTPGroup>
                    <InputOTPSlot tabIndex={0} />
                    <InputOTPSlot tabIndex={1} />
                    <InputOTPSlot tabIndex={2} />
                  </InputOTPGroup>

                  <InputOTPSeparator />

                  <InputOTPGroup>
                    <InputOTPSlot tabIndex={3} />
                    <InputOTPSlot tabIndex={4} />
                    <InputOTPSlot tabIndex={5} />
                  </InputOTPGroup>
                </InputOTP>
                </div>

                
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-muted-foreground flex items-center justify-between text-center">
                    Please enter the 6-digit code
                  </p>
                  <p className="flex items-center justify-end underline cursor-pointer text-sm hover:no-underline" 
                    onClick={() => setVerificationCode('')}>
                    reset
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !verificationCode || verificationCode.length !== 6 || isExpired}
                >
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </CardContent>
          
          {isExpired && !error && (
            <Alert className="mb-4 bg-transparent border-none">
              <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-800">
                  Your verification code has expired. Please request a new one.
                </AlertDescription>
            </Alert>
          )}

          <CardFooter className="flex flex-col items-center justify-center">
            {timeLeft > 0 ? (
              <div className="text-center">
                <p className="text-sm text-gray-700">
                  Verification code expires in: 0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </p>
              </div>
            ) : (
              <div className="text-sm text-center text-muted-foreground">
                Didn't receive a code or code expired?{" "}
                <button
                  type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={handleResendCode}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend verification code"}
                </button>
              </div>
            )}
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-white/80 text-sm">
          <div>Zero Trust AI-Powered File Management System</div>
          <div>© {new Date().getFullYear()} ZeroTrust AI</div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;