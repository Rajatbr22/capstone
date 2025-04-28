
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  User, 
  Activity, 
  Settings, 
  LogOut,
  Home,
  BarChart,
  AlertCircle,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { auth, logout, checkAccess } = useAuth();
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
      requiredRole: 'guest' as const,
    },
    {
      name: 'Files',
      path: '/files',
      icon: <FileText className="w-5 h-5" />,
      requiredRole: 'guest' as const,
    },
    {
      name: 'Activity',
      path: '/activity',
      icon: <Activity className="w-5 h-5" />,
      requiredRole: 'user' as const,
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart className="w-5 h-5" />,
      requiredRole: 'manager' as const,
    },
    {
      name: 'Users',
      path: '/users',
      icon: <User className="w-5 h-5" />,
      requiredRole: 'admin' as const,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      requiredRole: 'user' as const,
    },
  ];
  
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border shrink-0 hidden md:block">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <h1 className="font-bold text-lg text-sidebar-foreground">ZeroSecure AI</h1>
        </div>
        <div className="text-xs text-sidebar-foreground/70 mt-1">
          AI-Powered Zero Trust Security
        </div>
      </div>
      
      {auth.user && (
        <div className="p-4 border-b border-sidebar-border">
          <NavLink to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {auth.user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sidebar-foreground">{auth.user.username}</div>
              <div className="text-xs text-sidebar-foreground/70">{auth.user.role}</div>
              <div className="text-xs text-sidebar-foreground/70">{auth.user.department_id}</div>
            </div>
          </NavLink>
        </div>
      )}
      
      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            checkAccess(item.requiredRole) && (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            )
          ))}
          
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <UserCircle className="w-5 h-5" />
              <span>Profile</span>
            </NavLink>
          </li>
          
          <li className="mt-4 pt-4 border-t border-sidebar-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 mt-auto text-xs text-sidebar-foreground/70 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Session expires in: {auth.sessionExpiry && 
            Math.max(0, Math.round((auth.sessionExpiry.getTime() - Date.now()) / 60000))} minutes
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
