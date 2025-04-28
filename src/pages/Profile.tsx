
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Shield, User, Mail, AlertTriangle } from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';

const Profile: React.FC = () => {
  const { auth, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const { toggleMfa } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Fix: Initialize with a boolean value derived from auth.user?.mfaEnabled, defaulting to true if undefined
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(auth.user?.mfaEnabled ?? true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Load user data when component mounts or auth changes
  useEffect(() => {
    if (auth.user) {
      setFormData(prev => ({
        ...prev,
        username: auth.user?.username || '',
        email: auth.user?.email || ''
      }));
      setMfaEnabled(auth.user?.mfaEnabled ?? true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [auth.user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMfaToggle = async () => {
    if (!auth.user) return;
    
    setIsUpdating(true);
    try {
      const success = await toggleMfa(auth.user, !mfaEnabled);
      
      if (success) {
        setMfaEnabled(!mfaEnabled);
        await updateUserProfile({ ...auth.user, mfaEnabled: !mfaEnabled });
        
        toast({
          title: !mfaEnabled ? "MFA Enabled" : "MFA Disabled",
          description: !mfaEnabled 
            ? "Multi-factor authentication has been enabled for your account." 
            : "Multi-factor authentication has been disabled. This reduces your account security.",
          variant: !mfaEnabled ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to update MFA settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const validatePasswordChange = () => {
    if (formData.newPassword && !formData.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to set a new password.",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.newPassword && formData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (formData.newPassword && !validatePasswordChange()) {
      return;
    }
    
    if (!auth.user) return;
    
    setIsUpdating(true);
    try {
      // Update the user profile
      const updatedUserData = {
        ...auth.user,
        username: formData.username,
        email: formData.email
      };
      
      const success = await updateUserProfile(updatedUserData);
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <div className="w-full max-w-md p-8 bg-card rounded-lg shadow animate-pulse">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded w-full mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!auth.user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
              <CardDescription>Please log in to view your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/login'} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={`https://avatars.dicebear.com/api/initials/${auth.user.username}.svg`} />
                <AvatarFallback>{auth.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-semibold">{auth.user.username}</h3>
              <p className="text-muted-foreground">{auth.user.email}</p>
              
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>Role</span>
                  </div>
                  <span className="font-medium capitalize">{auth.user.role}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>MFA Status</span>
                  </div>
                  <span className={`font-medium ${auth.user.mfaEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                    {auth.user.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Risk Score</span>
                  </div>
                  <span className={`font-medium ${
                    auth.user.riskScore && auth.user.riskScore > 0.7 
                      ? 'text-red-600' 
                      : auth.user.riskScore && auth.user.riskScore > 0.3 
                        ? 'text-amber-600' 
                        : 'text-green-600'
                  }`}>
                    {auth.user.riskScore ? Math.round(auth.user.riskScore * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Edit Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Multi-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        {mfaEnabled 
                          ? "MFA adds an extra layer of security to your account" 
                          : "Enable MFA for enhanced security"}
                      </p>
                    </div>
                    <Switch
                      checked={mfaEnabled}
                      onCheckedChange={handleMfaToggle}
                      disabled={isUpdating}
                    />
                  </div>
                  {!mfaEnabled && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                      <p className="font-medium">Security Warning</p>
                      <p>MFA is strongly recommended for all accounts to protect against unauthorized access.</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
