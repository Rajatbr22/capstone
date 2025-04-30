// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableFooter,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { User, Role } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { MoreVertical, Edit, Trash, User as UserIcon, CheckCircle, Ban, Copy, Mail, Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from '@/components/ui/badge';
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
// import { toast } from '@/hooks/use-toast';
// import { useSupabase } from '@/hooks/use-supabase';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormMessage,
// } from "@/components/ui/form"
// import { z } from "zod"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import { cn } from '@/lib/utils';

// const userSchema = z.object({
//   username: z.string().min(2, {
//     message: "Username must be at least 2 characters.",
//   }),
//   email: z.string().email({
//     message: "Invalid email address.",
//   }),
//   role: z.enum(['admin', 'manager', 'user', 'guest']),
//   riskScore: z.number().min(0).max(100).optional(),
//   mfaEnabled: z.boolean().optional(),
// })

// const Users: React.FC = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const { auth, checkAccess } = useAuth();
//   const { supabase, getUserProfile } = useSupabase();
//   const [isLoading, setIsLoading] = useState(false);
  
//   const fetchUsers = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*');
      
//       if (error) {
//         console.error('Error fetching users:', error);
//         toast({
//           title: "Error",
//           description: "Failed to fetch users",
//           variant: "destructive",
//         });
//         return;
//       }
      
//       const formattedUsers = await Promise.all(data.map(async (user: any) => {
//         return {
//           id: user.id,
//           username: user.username,
//           email: user.email,
//           role: user.role as Role,
//           mfaEnabled: user.mfa_enabled,
//           lastLogin: user.last_login ? new Date(user.last_login) : undefined,
//           riskScore: user.risk_score
//         };
//       }));
      
//       setUsers(formattedUsers);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [supabase]);
  
//   useEffect(() => {
//     fetchUsers();
//   }, [fetchUsers]);
  
//   const filteredUsers = users.filter(user =>
//     user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     user.email.toLowerCase().includes(searchQuery.toLowerCase())
//   );
  
//   const handleEditClick = (user: User) => {
//     setSelectedUser(user);
//     setIsEditDialogOpen(true);
//   };
  
//   const handleDeleteClick = (user: User) => {
//     setSelectedUser(user);
//     setIsDeleteDialogOpen(true);
//   };
  
//   const handleCopyClick = (text: string) => {
//     navigator.clipboard.writeText(text);
//     toast({
//       title: "Copied to clipboard",
//       description: text,
//     });
//   };
  
//   const handleUpdateUser = async (values: z.infer<typeof userSchema>) => {
//     if (!selectedUser) return;
    
//     setIsLoading(true);
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({
//           username: values.username,
//           email: values.email,
//           role: values.role,
//           risk_score: values.riskScore,
//           mfa_enabled: values.mfaEnabled
//         })
//         .eq('id', selectedUser.id);
        
//       if (error) {
//         console.error('Error updating user:', error);
//         toast({
//           title: "Error",
//           description: "Failed to update user",
//           variant: "destructive",
//         });
//         return;
//       }
      
//       toast({
//         title: "User updated",
//         description: `${values.username} has been updated successfully`,
//       });
      
//       setIsEditDialogOpen(false);
//       fetchUsers();
//     } catch (error) {
//       console.error('Error updating user:', error);
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleDeleteUser = async () => {
//     if (!selectedUser) return;
    
//     setIsLoading(true);
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .delete()
//         .eq('id', selectedUser.id);
        
//       if (error) {
//         console.error('Error deleting user:', error);
//         toast({
//           title: "Error",
//           description: "Failed to delete user",
//           variant: "destructive",
//         });
//         return;
//       }
      
//       toast({
//         title: "User deleted",
//         description: `${selectedUser.username} has been deleted successfully`,
//       });
      
//       setIsDeleteDialogOpen(false);
//       fetchUsers();
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const form = useForm<z.infer<typeof userSchema>>({
//     resolver: zodResolver(userSchema),
//     defaultValues: {
//       username: selectedUser?.username || "",
//       email: selectedUser?.email || "",
//       role: selectedUser?.role || "user",
//       riskScore: selectedUser?.riskScore || 0,
//       mfaEnabled: selectedUser?.mfaEnabled || false,
//     },
//     mode: "onChange",
//     values: {
//       username: selectedUser?.username || "",
//       email: selectedUser?.email || "",
//       role: selectedUser?.role || "user",
//       riskScore: selectedUser?.riskScore || 0,
//       mfaEnabled: selectedUser?.mfaEnabled || false,
//     }
//   })
  
//   useEffect(() => {
//     form.reset({
//       username: selectedUser?.username || "",
//       email: selectedUser?.email || "",
//       role: selectedUser?.role || "user",
//       riskScore: selectedUser?.riskScore || 0,
//       mfaEnabled: selectedUser?.mfaEnabled || false,
//     });
//   }, [selectedUser]);
  
//   const hasAccessToView = (role: Role) => role !== "user" && role !== "guest";
  
//   return (
//     <div>
//       <div className="flex items-center justify-between space-y-2 md:space-y-0">
//         <div>
//           <h1 className="text-2xl font-semibold">Users</h1>
//           <p className="text-muted-foreground">
//             Manage users and their roles.
//           </p>
//         </div>
//         <Input
//           placeholder="Search users..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//       </div>
      
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>User List</CardTitle>
//           <CardDescription>
//             View and manage users in the system.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableCaption>A list of users in your account.</TableCaption>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="w-[50px]">Avatar</TableHead>
//                 <TableHead>Username</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Role</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredUsers.map((user) => (
//                 <TableRow key={user.id}>
//                   <TableCell>
//                     <Avatar>
//                       <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} />
//                       <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
//                     </Avatar>
//                   </TableCell>
//                   <TableCell>{user.username}</TableCell>
//                   <TableCell>
//                     {user.email}
//                     <Button variant="ghost" size="icon" className="ml-2" onClick={() => handleCopyClick(user.email)}>
//                       <Copy className="w-4 h-4" />
//                     </Button>
//                   </TableCell>
//                   <TableCell>
//                     <Badge variant="secondary">{user.role}</Badge>
//                   </TableCell>
//                   <TableCell>
//                     {user.mfaEnabled ? (
//                       <div className="flex items-center">
//                         <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
//                         <span>MFA Enabled</span>
//                       </div>
//                     ) : (
//                       <div className="flex items-center">
//                         <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
//                         <span>MFA Disabled</span>
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" className="h-8 w-8 p-0">
//                           <span className="sr-only">Open menu</span>
//                           <MoreVertical className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => handleEditClick(user)}>
//                           <Edit className="w-4 h-4 mr-2" />
//                           <span>Edit</span>
//                         </DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => handleDeleteClick(user)}>
//                           <Trash className="w-4 h-4 mr-2" />
//                           <span>Delete</span>
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
      
//       {/* Edit User Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader>
//             <DialogTitle>Edit User</DialogTitle>
//             <DialogDescription>
//               Make changes to the user's profile here. Click save when you're done.
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
//               <div className="space-y-2">
//                 <FormItem>
//                   <Label htmlFor="username">Username</Label>
//                   <FormControl>
//                     <Input id="username" placeholder="Username" {...form.register("username")} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               </div>
//               <div className="space-y-2">
//                 <FormItem>
//                   <Label htmlFor="email">Email</Label>
//                   <FormControl>
//                     <Input id="email" placeholder="Email" {...form.register("email")} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               </div>
//               <div className="space-y-2">
//                 <FormItem>
//                   <Label htmlFor="role">Role</Label>
//                   <Select onValueChange={value => form.setValue("role", value as Role)} defaultValue={selectedUser?.role}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a role" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="admin">Admin</SelectItem>
//                       <SelectItem value="manager">Manager</SelectItem>
//                       <SelectItem value="user">User</SelectItem>
//                       {checkAccess('admin') && (
//                         <SelectItem value="guest">Guest</SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               </div>
//               <div className="space-y-2">
//                 <FormItem>
//                   <div className="flex items-center justify-between">
//                     <Label htmlFor="mfaEnabled">MFA Enabled</Label>
//                     <FormControl>
//                       <input
//                         type="checkbox"
//                         id="mfaEnabled"
//                         className="h-4 w-4 border border-input bg-background focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
//                         {...form.register("mfaEnabled")}
//                       />
//                     </FormControl>
//                   </div>
//                   <FormMessage />
//                 </FormItem>
//               </div>
//               <DialogFooter>
//                 <Button type="submit">Save changes</Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
      
//       {/* Delete User Dialog */}
//       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader>
//             <DialogTitle>Delete User</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete this user? This action cannot be undone.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="py-4">
//             <p>
//               Deleting user <span className="font-medium">{selectedUser?.username}</span> will remove all their data from the system.
//             </p>
//           </div>
//           <DialogFooter>
//             <Button type="button" variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button type="button" variant="destructive" onClick={handleDeleteUser}>
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default Users;



import React, { useState } from 'react';
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
import { mockUsers } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { User as UserType } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>(mockUsers);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'user' as UserType['role'],
    mfaEnabled: true,
  });
  
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
  
  const handleAddUser = () => {
    const newUserObj: UserType = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      lastLogin: new Date(),
      mfaEnabled: newUser.mfaEnabled,
      riskScore: 0.1,
    };
    
    setUsers(prev => [...prev, newUserObj]);
    setShowAddUserDialog(false);
    
    // Reset form
    setNewUser({
      username: '',
      email: '',
      role: 'user',
      mfaEnabled: true,
    });
    
    toast({
      title: "User Added",
      description: `${newUser.username} has been added as a ${newUser.role}`,
    });
  };
  
  const getRiskBadge = (riskScore: number) => {
    if (riskScore > 0.7) {
      return <Badge variant="destructive">High</Badge>;
    } else if (riskScore > 0.4) {
      return <Badge variant="default">Medium</Badge>;
    } else {
      return <Badge variant="secondary">Low</Badge>;
    }
  };
  
  const handleResetMFA = (userId: string) => {
    toast({
      title: "MFA Reset",
      description: "User will need to reconfigure MFA on next login",
    });
  };
  
  const handleUserRoleChange = (userId: string, newRole: UserType['role']) => {
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
  };
  
  const disableUser = (userId: string) => {
    toast({
      title: "User Disabled",
      description: "User account has been temporarily disabled",
    });
  };
  
  return (
    <Layout requireAuth={true} requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users and security roles
            </p>
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
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
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
            <div className="rounded-md border">
              <div className="grid grid-cols-6 border-b px-4 py-3 font-medium">
                <div className="col-span-2">User</div>
                <div className="hidden sm:block">Role</div>
                <div className="hidden md:block">Last Login</div>
                <div className="hidden lg:block">Risk Score</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-6 px-4 py-3 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block">
                        <Badge variant={
                          user.role === 'admin' ? 'destructive' :
                          user.role === 'manager' ? 'default' :
                          user.role === 'user' ? 'secondary' :
                          'outline'
                        }>
                          {user.role}
                        </Badge>
                      </div>
                      
                      <div className="hidden md:block text-sm text-muted-foreground">
                        {new Date(user.lastLogin).toLocaleString()}
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
                              Risk score: {user.riskScore.toFixed(2)}
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
                              View Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'admin')}>
                              <Shield className="w-4 h-4 mr-2 text-red-500" />
                              Make Admin
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'manager')}>
                              <Shield className="w-4 h-4 mr-2 text-blue-500" />
                              Make Manager
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onSelect={() => handleUserRoleChange(user.id, 'user')}>
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
                  <span>Managers</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'manager').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users</span>
                  <span className="font-semibold">{users.filter(u => u.role === 'user').length}</span>
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Security Audit</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>MFA Compliance Check</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
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
                  onValueChange={(value: any) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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