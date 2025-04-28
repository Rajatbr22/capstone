import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { User, Role } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash, User as UserIcon, CheckCircle, Ban, Copy, Mail, Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/use-supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { cn } from '@/lib/utils';

const userSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  role: z.enum(['admin', 'manager', 'user', 'guest']),
  riskScore: z.number().min(0).max(100).optional(),
  mfaEnabled: z.boolean().optional(),
})

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { auth, checkAccess } = useAuth();
  const { supabase, getUserProfile } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }
      
      const formattedUsers = await Promise.all(data.map(async (user: any) => {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as Role,
          mfaEnabled: user.mfa_enabled,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          riskScore: user.risk_score
        };
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCopyClick = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };
  
  const handleUpdateUser = async (values: z.infer<typeof userSchema>) => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          email: values.email,
          role: values.role,
          risk_score: values.riskScore,
          mfa_enabled: values.mfaEnabled
        })
        .eq('id', selectedUser.id);
        
      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "User updated",
        description: `${values.username} has been updated successfully`,
      });
      
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "User deleted",
        description: `${selectedUser.username} has been deleted successfully`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: selectedUser?.username || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "user",
      riskScore: selectedUser?.riskScore || 0,
      mfaEnabled: selectedUser?.mfaEnabled || false,
    },
    mode: "onChange",
    values: {
      username: selectedUser?.username || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "user",
      riskScore: selectedUser?.riskScore || 0,
      mfaEnabled: selectedUser?.mfaEnabled || false,
    }
  })
  
  useEffect(() => {
    form.reset({
      username: selectedUser?.username || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "user",
      riskScore: selectedUser?.riskScore || 0,
      mfaEnabled: selectedUser?.mfaEnabled || false,
    });
  }, [selectedUser]);
  
  const hasAccessToView = (role: Role) => role !== "user" && role !== "guest";
  
  return (
    <div>
      <div className="flex items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">
            Manage users and their roles.
          </p>
        </div>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            View and manage users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of users in your account.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Avatar</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {user.email}
                    <Button variant="ghost" size="icon" className="ml-2" onClick={() => handleCopyClick(user.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.mfaEnabled ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        <span>MFA Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>MFA Disabled</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(user)}>
                          <Trash className="w-4 h-4 mr-2" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              <div className="space-y-2">
                <FormItem>
                  <Label htmlFor="username">Username</Label>
                  <FormControl>
                    <Input id="username" placeholder="Username" {...form.register("username")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
              <div className="space-y-2">
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input id="email" placeholder="Email" {...form.register("email")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
              <div className="space-y-2">
                <FormItem>
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={value => form.setValue("role", value as Role)} defaultValue={selectedUser?.role}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      {checkAccess('admin') && (
                        <SelectItem value="guest">Guest</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </div>
              <div className="space-y-2">
                <FormItem>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mfaEnabled">MFA Enabled</Label>
                    <FormControl>
                      <input
                        type="checkbox"
                        id="mfaEnabled"
                        className="h-4 w-4 border border-input bg-background focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("mfaEnabled")}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Deleting user <span className="font-medium">{selectedUser?.username}</span> will remove all their data from the system.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
