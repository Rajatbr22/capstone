
import React from 'react';
import { Shield, Bell, Cog, FileText, Lock, User, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { auth } = useAuth();
  
  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your security settings have been updated",
    });
  };
  
  return (
    <Layout requireAuth={true} requiredRole="employee">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure security preferences and options
          </p>
        </div>
        
        <Tabs defaultValue="security">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="security" className="flex gap-2 items-center">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex gap-2 items-center">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex gap-2 items-center">
              <Cog className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="security">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                      Configure how you authenticate with the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Multi-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Require a verification code when signing in
                        </p>
                      </div>
                      <Switch defaultChecked={auth.user?.mfaEnabled} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Session Timeout</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out after a period of inactivity
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-base">Session Duration</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Set how long your session remains active before timing out
                      </p>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <Slider defaultValue={[30]} max={60} step={5} />
                        <div className="col-span-2 flex items-center">
                          <span className="font-medium text-lg">30</span>
                          <span className="ml-2 text-muted-foreground">minutes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Access Control</CardTitle>
                    <CardDescription>
                      Manage how you access sensitive resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Re-authenticate for Sensitive Actions</Label>
                        <p className="text-sm text-muted-foreground">
                          Require password re-entry for high-risk operations
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Trusted Devices</Label>
                        <p className="text-sm text-muted-foreground">
                          Remember devices you've previously used to sign in
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">IP Restriction</Label>
                        <p className="text-sm text-muted-foreground">
                          Limit access to specific IP addresses
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>
                      Configure password requirements and rotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Password Strength</Label>
                      <RadioGroup defaultValue="strong">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="basic" id="basic" />
                          <Label htmlFor="basic">Basic (8+ characters)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium (8+ chars, mixed case, numbers)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="strong" id="strong" />
                          <Label htmlFor="strong">Strong (12+ chars, mixed case, numbers, symbols)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Password Rotation</Label>
                        <p className="text-sm text-muted-foreground">
                          Require password change every 90 days
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Password History</Label>
                        <p className="text-sm text-muted-foreground">
                          Prevent reuse of previous passwords
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
                
                <Button onClick={handleSave}>Save Security Settings</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Alerts</CardTitle>
                    <CardDescription>
                      Configure when and how you receive security alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Login Attempts</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts for suspicious login attempts
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">New Device Logins</Label>
                        <p className="text-sm text-muted-foreground">
                          Alert when your account is accessed from a new device
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">High-Risk Activities</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about potentially dangerous actions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Password Changes</Label>
                        <p className="text-sm text-muted-foreground">
                          Alert when your password is changed
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Methods</CardTitle>
                    <CardDescription>
                      Choose how you want to receive security notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send security alerts to {auth.user?.email}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Show alerts within the application
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send text messages for critical alerts (requires phone setup)
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
                
                <Button onClick={handleSave}>Save Notification Settings</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="system">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Security</CardTitle>
                    <CardDescription>
                      Configure system-wide security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Audit Logging</Label>
                        <p className="text-sm text-muted-foreground">
                          Record detailed logs of all system activities
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">AI-Powered Threat Detection</Label>
                        <p className="text-sm text-muted-foreground">
                          Use machine learning to identify unusual patterns
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Zero Trust Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enforce continuous verification for all resources
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">File Scanning</Label>
                        <p className="text-sm text-muted-foreground">
                          Scan uploaded files for malware and sensitive content
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>
                      Configure privacy and data handling settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Activity Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Track user activities for security analysis
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Data Retention</Label>
                        <p className="text-sm text-muted-foreground">
                          Store activity logs for 90 days
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Anonymized Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Share anonymized usage data to improve security
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Interface</CardTitle>
                    <CardDescription>
                      Configure user interface settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Use dark color scheme for the interface
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Security Status Indicator</Label>
                        <p className="text-sm text-muted-foreground">
                          Show security status in the navigation bar
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Compact View</Label>
                        <p className="text-sm text-muted-foreground">
                          Use compact layout for tables and lists
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
                
                <Button onClick={handleSave}>Save System Settings</Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
