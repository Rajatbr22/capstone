
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
import { setExpiryBasedOnRole } from '@/lib/expiryTime';

const Sidebar: React.FC = () => {
  const { auth, logout, checkAccess } = useAuth();
  const expiryTime = setExpiryBasedOnRole(auth.user.role)

  const navItems = [
    {
      name: 'Dashboard',
      path: (auth.user.role === 'admin' ? `/dashboard/${auth.user.id}` : `/dashboard/${auth.user.id}/${auth.user.department_id}`),
      icon: <Home className="w-5 h-5" />,
      requiredRole: 'guest' as const,
    },
    {
      name: 'Files',
      path: (auth.user.role === 'admin' ? `/files/${auth.user.id}` : `/files/${auth.user.id}/${auth.user.department_id}`),
      icon: <FileText className="w-5 h-5" />,
      requiredRole: 'guest' as const,
    },
    {
      name: 'Activity',
      path: (auth.user.role === 'admin' ? `/activity/${auth.user.id}` : `/activity/${auth.user.id}/${auth.user.department_id}`),
      icon: <Activity className="w-5 h-5" />,
      requiredRole: 'employee' as const,
    },
    {
      name: 'Analytics',
      path: (auth.user.role === 'admin' ? `/analytics/${auth.user.id}` : `/analytics/${auth.user.id}/${auth.user.department_id}`),
      icon: <BarChart className="w-5 h-5" />,
      requiredRole: 'department_head' as const,
    },
    {
      name: 'Users',
      path: (auth.user.role === 'admin' ? `/users/${auth.user.id}` : `/users/${auth.user.id}/${auth.user.department_id}`),
      icon: <User className="w-5 h-5" />,
      requiredRole: 'admin' as const,
    },
    {
      name: 'Settings',
      path: (auth.user.role === 'admin' ? `/settings/${auth.user.id}` : `/settings/${auth.user.id}/${auth.user.department_id}`),
      icon: <Settings className="w-5 h-5" />,
      requiredRole: 'employee' as const,
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
          <NavLink to={auth.user.role === 'admin' ? `/profile/${auth.user.id}` : `/profile/${auth.user.id}/${auth.user.department_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {auth.user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sidebar-foreground">
                {auth.user.email.split('@')[0]}
              </div>
              <div className="text-xs text-sidebar-foreground/70 flex items-center justify-between gap-4 mt-2">
                <span>role: {auth.user.role}</span>
                <span className='font-semibold text-black bg-gradient-to-r from-green-300 to-blue-300 hover:from-pink-500 hover:to-yellow-500 hover:text-white p-1 rounded'>{auth.user.departmentName}</span>
              </div>
              {/* <div className="text-xs text-sidebar-foreground/70">{(auth.user.role === 'admin' ? '' : auth.user.department_id)}</div> */}
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
              to={auth.user.role === 'admin' ? `/profile/${auth.user.id}` : `/profile/${auth.user.id}/${auth.user.department_id}`}
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
          <span>
            Session expires in: <span className='animate-pulse'>{Math.max(0, Math.floor((new Date(auth.sessionExpiry).getTime() - Date.now()) / 60000))}{" "}minutes</span> 
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
