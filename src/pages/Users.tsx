import React, { useEffect, useState } from 'react';
import { User, Shield, Filter, Search, Plus, MoreHorizontal, AlertTriangle, CheckCircle, History } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User as UserType } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '@/lib/fetchInstance';
import { useAuth } from '@/contexts/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const { auth } = useAuth();
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'guest',
    mfaEnabled: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [auth.user?.role]);

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = 
      filterRole === 'all' || 
      user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const fetchUsers = async() => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/getUsers/${auth.user.id}/${auth.user.role}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
      });

      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to fetch users. Please try again later.",
          variant: "destructive",
        });
      }

      const data = await response.json();
      // console.log('data', data)
      // setUsers(data.users)
      if (data) {
        // console.log(data.users)
        setUsers(data.users);
      } 
      else {
        toast({
          title: 'Error',
          description: 'Failed to load users.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      const response = await fetchWithAuth('/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          mfaEnabled: newUser.mfaEnabled,
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh user list after adding new user
        fetchUsers();
        
        setShowAddUserDialog(false);
        
        // Reset form
        setNewUser({
          username: '',
          email: '',
          role: 'guest',
          mfaEnabled: true,
        });
        
        toast({
          title: "User Added",
          description: `${newUser.username} has been added as a ${newUser.role}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRiskBadge = (riskScore) => {
    if (riskScore > 0.7) {
      return <Badge variant="destructive">High</Badge>;
    } else if (riskScore > 0.4) {
      return <Badge variant="default">Medium</Badge>;
    } else {
      return <Badge variant="secondary">Low</Badge>;
    }
  };

  const handleResetMFA = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetchWithAuth(`/user/resetMFA/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset MFA');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "MFA Reset",
          description: "User will need to reconfigure MFA on next login",
        });
        
        // Refresh user list to reflect changes
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset MFA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting MFA:", error);
      toast({
        title: "Error",
        description: "Failed to reset MFA. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetchWithAuth(`/user/updateRole/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local state to reflect the role change
        setUsers(prev =>
          prev.map(user =>
            user.id === userId
              ? { ...user, role: newRole }
              : user
          )
        );
        
        toast({
          title: "Role Updated",
          description: `User role has been updated to ${newRole}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update user role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disableUser = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetchWithAuth(`/user/disable/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to disable user');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "User Disabled",
          description: "User account has been temporarily disabled",
        });
        
        // Refresh user list to reflect changes
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to disable user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error disabling user:", error);
      toast({
        title: "Error",
        description: "Failed to disable user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (username) => {
    if (!username) return '';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Layout requireAuth={true} requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage users and security roles</p>
          </div>

          <Button 
            onClick={() => setShowAddUserDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </Button>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="department_head">Department Head</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage users and their access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-7 items-center border-b px-4 py-3 font-medium">
                  <div className="col-span-2">User</div>
                  <div className="hidden sm:block">Role</div>
                  <div className="hidden sm:block">Department</div>
                  <div className="hidden md:block">Last Login</div>
                  <div className="hidden lg:block">Risk Score</div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user._id} className="grid grid-cols-7 px-4 py-3 items-center">
                        <div className="col-span-2 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {getInitials(user.username)}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>

                        
                        <div className="hidden sm:block">
                          <Badge variant={
                            user.role === 'admin' ? 'destructive' :
                            user.role === 'department_head' ? 'default' :
                            user.role === 'employee' ? 'secondary' :
                            'outline'
                          }>
                            {user.role}
                          </Badge>
                        </div>

                        <div>
                          {user.departmentName}
                        </div>
                        
                        <div className="hidden md:block text-sm text-muted-foreground">
                          {new Date(user.updatedAt).toLocaleString()}
                        </div>
                        
                        <div className="hidden lg:flex items-center">
                          {getRiskBadge(user.riskScore)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle 
                                  className={`ml-2 w-4 h-4 ${
                                    user.riskScore > 0.7 ? 'text-red-500' :
                                    user.riskScore > 0.4 ? 'text-yellow-500' :
                                    'text-green-500'
                                  }`} 
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                Risk score: {user.riskScore?.toFixed(2) || 'N/A'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <User className="w-4 h-4 mr-2" />
                                Update Profile
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'admin')}>
                                <Shield className="w-4 h-4 mr-2 text-red-500" />
                                Make Admin
                              </DropdownMenuItem> */}
                              
                              <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'department_head')}>
                                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                                Make Department Head
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'employee')}>
                                <Shield className="w-4 h-4 mr-2 text-green-500" />
                                Make User
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'guest')}>
                                <Shield className="w-4 h-4 mr-2 text-gray-500" />
                                Make Guest
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onSelect={() => handleResetMFA(user.id)}>
                                <History className="w-4 h-4 mr-2" />
                                Reset MFA
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onSelect={() => disableUser(user.id)}
                                className="text-red-500"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Disable Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <User className="w-10 h-10 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No users found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Security Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Admins</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'admin').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Department Heads</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'department_head').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'employee').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'guest').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>MFA Enabled</span>
                  <span className="font-semibold">{users.filter(u => u.mfaEnabled).length}/{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>High Risk Users</span>
                  <span className="font-semibold text-red-500">{users.filter(u => u.riskScore > 0.7).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Logins (24h)</span>
                  <span className="font-semibold">{users.filter(u => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return new Date(u.lastLogin) > yesterday;
                  }).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Security Audit</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>MFA Compliance Check</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span>Risk Assessment</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role-based access control
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={newUser.username} 
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="johndoe" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john.doe@example.com" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="department_head">Manager</SelectItem>
                    <SelectItem value="employee">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Multi-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    User will be prompted to set up MFA on first login
                  </p>
                </div>
                <Switch 
                  checked={newUser.mfaEnabled} 
                  onCheckedChange={(checked) => setNewUser({...newUser, mfaEnabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Force Password Change</Label>
                  <p className="text-sm text-muted-foreground">
                    User must change password on first login
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Restrictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit access to specific network ranges
                  </p>
                </div>
                <Switch />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Users;