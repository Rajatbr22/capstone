import React, { useState } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  Search,
  Shield,
  Moon,
  Sun
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const TopBar: React.FC = () => {
  const { auth, logout, checkAccess } = useAuth();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      requiredRole: 'guest' as const,
    },
    {
      name: 'Files',
      path: '/files',
      requiredRole: 'guest' as const,
    },
    {
      name: 'Activity',
      path: '/activity',
      requiredRole: 'user' as const,
    },
    {
      name: 'Analytics',
      path: '/analytics',
      requiredRole: 'manager' as const,
    },
    {
      name: 'Users',
      path: '/users',
      requiredRole: 'admin' as const,
    },
    {
      name: 'Settings',
      path: '/settings',
      requiredRole: 'user' as const,
    },
  ];
  
  const unreadNotifications = notifications.filter(n => !n.read);
  
  const handleViewAllNotifications = () => {
    // Navigate to a notifications page or mark all as read
    unreadNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to files page with search query
      navigate(`/files?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-border shadow-sm z-10">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Mobile menu button */}
        <button 
          className="md:hidden mr-2" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
        
        {/* Logo (mobile only) */}
        <div className="flex items-center md:hidden">
          <Shield className="w-5 h-5 text-primary mr-1" />
          <span className="font-bold">ZeroSecure</span>
        </div>
        
        {/* Search bar */}
        <div className="hidden md:flex flex-1 max-w-md relative mx-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search files, users, or activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-1.5 pl-10 pr-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
        </div>
        
        {/* Right section with theme toggle, notifications and profile */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="relative"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-0 right-0 block w-2 h-2 rounded-full bg-red-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {unreadNotifications.length > 0 ? (
                <>
                  {unreadNotifications.slice(0, 5).map(notification => (
                    <DropdownMenuItem key={notification.id} className="py-2 px-4 cursor-pointer" onClick={() => markAsRead(notification.id)}>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            notification.type === 'error' ? "bg-red-500" :
                            notification.type === 'warning' ? "bg-yellow-500" :
                            notification.type === 'success' ? "bg-green-500" :
                            notification.type === 'security' ? "bg-purple-500" :
                            notification.type === 'alert' ? "bg-orange-500" :
                            "bg-blue-500"
                          )} />
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleViewAllNotifications}>
                    <span className="mx-auto font-medium">Mark all as read</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="py-4 px-4 text-center text-muted-foreground">
                  No unread notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {auth.user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium hidden md:inline-block">
                  {auth.user?.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <NavLink to="/profile">Profile</NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/settings">Settings</NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border py-2 bg-background">
          <div className="px-4 py-2">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1.5 pl-10 pr-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>
          <nav>
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                checkAccess(item.requiredRole) && (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "block px-3 py-2 rounded-md",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                  </li>
                )
              ))}
              <li className="mt-4 pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={logout}
                >
                  Log Out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default TopBar;
