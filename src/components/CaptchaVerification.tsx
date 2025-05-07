import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActivity } from '@/contexts/ActivityContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CaptchaVerificationProps {
    onVerify: () => Promise<void> | void;
    onFailure: () => void;
    maxAttempts?: number;
    dashboardPath?: string;
}

// Custom CAPTCHA engine to replace react-simple-captcha with our own implementation
class CustomCaptchaEngine {
    private static instance: CustomCaptchaEngine;
    private currentCaptcha: string = '';
    private captchaLength: number = 6;
    
    // Singleton pattern
    public static getInstance(): CustomCaptchaEngine {
        if (!CustomCaptchaEngine.instance) {
            CustomCaptchaEngine.instance = new CustomCaptchaEngine();
        }
        return CustomCaptchaEngine.instance;
    }
    
    // Generate a mixed alphanumeric CAPTCHA
    public generateCaptcha(length: number = 6): string {
        this.captchaLength = length;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        
        // Ensure at least one letter and one number
        result += chars.substring(0, 24).charAt(Math.floor(Math.random() * 24));
        result += chars.substring(24).charAt(Math.floor(Math.random() * 8)); 
        
        for (let i = 2; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Shuffle the result
        result = this.shuffleString(result);
        
        this.currentCaptcha = result;
        return result;
    }
    
    // Helper to shuffle a string
    private shuffleString(str: string): string {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }
    
    // Get the current CAPTCHA value
    public getCurrentCaptcha(): string {
        return this.currentCaptcha;
    }
    
    // Validate user input against current CAPTCHA
    public validateCaptcha(userInput: string, caseSensitive: boolean = true): boolean {
        if (!caseSensitive) {
            return userInput.toUpperCase() === this.currentCaptcha.toUpperCase();
        }
        return userInput === this.currentCaptcha;
    }
    
    // Create canvas with CAPTCHA text
    public createCaptchaCanvas(canvasId: string, width: number = 200, height: number = 50): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Clear canvas
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, width, height);
        
        // Draw noise (dots)
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.2)`;
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Draw lines
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }
        
        // Draw CAPTCHA text
        const text = this.currentCaptcha;
        const fontSize = height * 0.6;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw each character with slight variations
        for (let i = 0; i < text.length; i++) {
            const charX = width * (i + 0.5) / text.length;
            const charY = height / 2 + (Math.random() * 8 - 4);
            const rotation = Math.random() * 0.4 - 0.2; // Rotate up to 0.2 radians (~11 degrees)
            
            ctx.save();
            ctx.translate(charX, charY);
            ctx.rotate(rotation);
            
            // Alternate colors for better visibility
            const isNumber = !isNaN(Number(text[i]));
            ctx.fillStyle = isNumber ? '#ffffff' : '#1858d9';
            
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
    }
}

// Custom LoadCanvasTemplate component to replace the one from react-simple-captcha
const LoadCanvasTemplate: React.FC = () => {
    const canvasId = 'captcha-canvas';
    
    useEffect(() => {
        // Wait for DOM to be ready
        setTimeout(() => {
            try {
                const captchaEngine = CustomCaptchaEngine.getInstance();
                captchaEngine.createCaptchaCanvas(canvasId);
            } catch (error) {
                console.error("Error rendering captcha canvas:", error);
            }
        }, 100);
    }, []);
    
    return (
        <div className="captcha-container">
            <canvas id={canvasId} className="captcha-canvas border rounded"></canvas>
        </div>
    );
};

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({ 
    onVerify, 
    onFailure,
    maxAttempts = 5,
    dashboardPath = `/department-selection`
}) => {
    const [captchaValue, setCaptchaValue] = useState('');
    const [captchaError, setCaptchaError] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const { toast } = useToast();
    const { logActivity } = useActivity();
    const navigate = useNavigate();
    const { auth } = useAuth()
    
    // Use a ref to track initialization status
    const isInitialized = useRef(false);
    
    // Initialize captcha on component mount
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;
        
        const checkPreviousVerification = () => {
            // Check if we have a previous verification
            const previouslyVerified = localStorage.getItem('captchaVerified') === 'true';
            if (previouslyVerified) {
                const verifiedAt = localStorage.getItem('captchaVerifiedAt');
                // Only consider valid if verified in the last hour
                if (verifiedAt) {
                    const verificationTime = new Date(verifiedAt).getTime();
                    const expirationTime = verificationTime + (60 * 60 * 1000); // 1 hour
                    if (Date.now() < expirationTime) {
                        setIsVerified(true);
                        // If already verified, navigate to dashboard
                        setTimeout(() => {
                            navigate(`${dashboardPath}/${auth.user.id}`);
                        }, 500);
                        return true;
                    }
                }
            }
            return false;
        };
        
        if (!checkPreviousVerification()) {
            // Only initialize captcha if not previously verified
            initCaptcha();
        }
    }, []); // Empty dependency array ensures this runs only once

    const initCaptcha = useCallback(() => {
        try {
            // Initialize our custom CAPTCHA engine with 6 characters
            const captchaEngine = CustomCaptchaEngine.getInstance();
            captchaEngine.generateCaptcha(6);
            
            // Wait for canvas to be available
            setTimeout(() => {
                try {
                    captchaEngine.createCaptchaCanvas('captcha-canvas');
                    // logActivity('captcha_loaded', 'security', 'low');
                } catch (innerError) {
                    console.error("Error creating captcha canvas:", innerError);
                }
            }, 200);
        } catch (error) {
            console.error("Error loading captcha:", error);
            // logActivity('captcha_load_error', 'security', 'high');
            
            // Fallback if captcha fails to load
            setTimeout(() => {
                try {
                    const captchaEngine = CustomCaptchaEngine.getInstance();
                    captchaEngine.generateCaptcha(6);
                    captchaEngine.createCaptchaCanvas('captcha-canvas');
                    
                    // logActivity('captcha_loaded_retry', 'security', 'medium');
                } catch (innerError) {
                    console.error("Second attempt to load captcha failed:", innerError);
                    // logActivity('captcha_load_error_retry', 'security', 'high');
                    
                    toast({
                        title: "CAPTCHA Error",
                        description: "Could not load the CAPTCHA. Please refresh the page and try again.",
                        variant: "destructive",
                    });
                }
            }, 1000);
        }
    }, [logActivity, toast]);

    const refreshCaptcha = useCallback(() => {
        if (isVerified) return; // Don't refresh if already verified
        
        try {
            const captchaEngine = CustomCaptchaEngine.getInstance();
            captchaEngine.generateCaptcha(6);
            
            setTimeout(() => {
                try {
                    captchaEngine.createCaptchaCanvas('captcha-canvas');
                    setCaptchaValue('');
                    setCaptchaError(false);
                    // logActivity('captcha_refreshed', 'security', 'low');
                } catch (innerError) {
                    console.error("Error refreshing captcha canvas:", innerError);
                }
            }, 100);
        } catch (error) {
            console.error("Error refreshing captcha:", error);
            // logActivity('captcha_refresh_error', 'security', 'medium');
            toast({
                title: "Captcha Error",
                description: "Could not refresh the CAPTCHA. Please try again or refresh the page.",
                variant: "destructive",
            });
        }
    }, [isVerified, logActivity, toast]);

    // Handle successful verification
    const handleSuccess = useCallback(async () => {
        try {
            setIsVerified(true);
            
            // Set captcha verification status in localStorage
            localStorage.setItem('captchaVerified', 'true');
            localStorage.setItem('captchaVerifiedAt', new Date().toISOString());
            
            // Log the successful verification
            logActivity('captcha_verified', 'security', 'low');
            
            // Show success message
            toast({
                title: "CAPTCHA Verified",
                description: "Verification successful. Redirecting to dashboard...",
            });
            
            // Call the onVerify callback
            await Promise.resolve(onVerify());
            
            // Navigation will be handled by the onVerify callback
        } catch (error) {
            console.error("Error during verification success handling:", error);
            logActivity('verification_success_error', 'security', 'high');
            
            // Show error message
            toast({
                title: "Verification Error",
                description: "An error occurred after verification. Please try again.",
                variant: "destructive",
            });
            
            // Reset verified state
            setIsVerified(false);
            localStorage.removeItem('captchaVerified');
            localStorage.removeItem('captchaVerifiedAt');
            
            // Refresh captcha
            refreshCaptcha();
        } finally {
            setIsVerifying(false);
        }
    }, [logActivity, onVerify, refreshCaptcha, toast]);
    
    // Handle failed verification
    const handleFailure = useCallback(() => {
        setCaptchaError(true);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // logActivity('captcha_failed', 'security', 'medium');
        
        toast({
            title: "CAPTCHA Failed",
            description: "Please enter the correct CAPTCHA code",
            variant: "destructive",
        });
        
        refreshCaptcha();
        
        // Check if max attempts reached
        if (newAttempts === maxAttempts) {
            toast({
                title: "Too Many Failed Attempts",
                description: `You have failed verification ${maxAttempts} times. Account is now blocked.`,
                variant: "destructive",
            });
            logActivity('captcha_blocked', 'security', 'high');
            onFailure();
        }
        
        setIsVerifying(false);
    }, [attempts, logActivity, maxAttempts, onFailure, refreshCaptcha, toast]);

    // Main verification handler
    const handleVerify = useCallback(async () => {
        if (isVerifying || isVerified) return;
        
        setCaptchaError(false);
        setIsVerifying(true);
        
        try {
            // Get the captcha value and ensure case handling is correct
            const userCaptcha = captchaValue.trim();
            
            // Validate captcha using our custom engine
            const captchaEngine = CustomCaptchaEngine.getInstance();
            const isValid = captchaEngine.validateCaptcha(userCaptcha, true); // true means case-sensitive
            
            if (!isValid) {
                handleFailure();
                return;
            }
            
            // Handle successful verification
            await handleSuccess();
        } catch (error) {
            console.error("Error during verification process:", error);
            logActivity('verification_process_error', 'security', 'high');
            
            toast({
                title: "Verification Error",
                description: "An error occurred during the verification process. Please try again.",
                variant: "destructive",
            });
            
            setIsVerifying(false);
            refreshCaptcha();
        }
    }, [captchaValue, handleFailure, handleSuccess, isVerified, isVerifying, logActivity, refreshCaptcha, toast]);

    // Handle Enter key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isVerifying && !isVerified && captchaValue.length >= 4) {
            handleVerify();
        }
    }, [captchaValue.length, handleVerify, isVerified, isVerifying]);

    // If already verified, show success state
    if (isVerified) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verification Successful</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="text-green-500 text-center mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <p className="mt-2 text-lg font-medium">CAPTCHA verified successfully!</p>
                        </div>
                        <p className="text-center text-muted-foreground">
                            Redirecting to dashboard...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-center'>Captcha Verification - Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="captcha" className='text-sm'>Please verify that you are human</Label>
                        <div className="p-3 rounded-md border">
                            <div className="flex items-center justify-between mb-2">
                                <LoadCanvasTemplate />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={refreshCaptcha}
                                    className="h-8 px-2"
                                    disabled={isVerifying}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-1" />
                                    Refresh
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mb-3 mt-4">
                                (Enter the mix of letters and numbers shown above)
                            </div>
                            <Input
                                id="captcha"
                                placeholder="Enter the code shown above"
                                value={captchaValue}
                                onChange={(e) => {
                                    if (e.target.value.length <= 6) {
                                        setCaptchaValue(e.target.value);
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                className={captchaError ? "border-red-500" : ""}
                                required
                                autoComplete="off"
                                disabled={isVerifying}
                            />
                            {captchaError && (
                                <p className="text-red-500 text-xs mt-1">Invalid CAPTCHA. Please try again.</p>
                            )}
                            
                            <div className="text-xs text-muted-foreground mt-4">
                                Attempts: {attempts} of {maxAttempts}
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleVerify} 
                        className="w-full"
                        disabled={isVerifying || captchaValue.length < 6}
                    >
                        {isVerifying ? "Verifying..." : "Verify"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default CaptchaVerification;