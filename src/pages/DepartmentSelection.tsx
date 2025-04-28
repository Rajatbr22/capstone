import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building, ChevronRight, Shield } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Cpu, Megaphone, Handshake, Banknote, UserCog, Package, Paintbrush, Headphones, Settings, Scale, Crown, MoreHorizontal } from 'lucide-react';


interface Department {
  _id: string;
  name: string;
  description: string;
  icon: string
}

const DepartmentSelection: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { auth } = useAuth();
  const { logActivity } = useActivity();
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch departments from backend
  const fetchDepartments = async () => {
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

      const res = await fetch(`${API_URL}/department/getDepartmentList`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }
      );

      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to fetch departments. Please try again later.",
          variant: "destructive",
        });
        throw new Error('Failed to fetch departments');
      }

      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load departments.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!auth.isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      await fetchDepartments();

      if (id) {
        setSelectedDepartment(id);
      }

      logActivity('department_selection_page_accessed', 'navigation', 'low');
    };

    checkAuthentication();
  }, [auth.isAuthenticated, id, navigate]);

  // const handleDepartmentSelect = async (departmentId: string) => {
  //   setSelectedDepartment(departmentId);

    
  //   logActivity('department_selected', 'navigation', 'low');
  //   localStorage.setItem('selectedDepartment', departmentId);

  //   navigate(`/dashboard/${departmentId}`, { replace: true });
  // };

  const handleDepartmentSelect = async (departmentId: string) => {
    setSelectedDepartment(departmentId);
    
    // Update user's department in the backend
    await updateUserDepartment(departmentId);
    
    logActivity('department_selected', 'navigation', 'low');
    localStorage.setItem('selectedDepartment', departmentId);
  
    navigate(`/dashboard/${departmentId}`, { replace: true });
  };

  // const updateUserDepartment = async (departmentId) => {
  //   try {
  //     const token = sessionStorage.getItem('token');
      
  //     if (!token) {
  //       toast({
  //         title: "Authentication Error",
  //         description: "No authentication token found. Please log in again.",
  //         variant: "destructive",
  //       });
  //       navigate('/login');
  //       return;
  //     }
      
  //     const response = await fetch(`${API_URL}/auth/update-profile`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         department_id: departmentId
  //       })
  //     });
      
  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       toast({
  //         title: "Update Failed",
  //         description: data.message || "Failed to update department",
  //         variant: "destructive",
  //       });
  //       return false;
  //     }
      
  //     toast({
  //       title: "Department Updated",
  //       description: "Your department has been updated successfully",
  //     });
      
  //     return true;
  //   } catch (error) {
  //     console.error('Error updating department:', error);
  //     toast({
  //       title: "Update Failed",
  //       description: "An unexpected error occurred",
  //       variant: "destructive",
  //     });
  //     return false;
  //   }
  // };

  const departmentDetails = [
    { name: 'Engineering', icon: Cpu, description: 'Building and maintaining system architecture.' },
    { name: 'Marketing', icon: Megaphone, description: 'Promoting brand, products, and services.' },
    { name: 'Sales', icon: Handshake, description: 'Driving revenue through client acquisition.' },
    { name: 'Finance', icon: Banknote, description: 'Managing budgeting, investments, and reporting.' },
    { name: 'Human Resources', icon: UserCog, description: 'Recruiting, training, and employee relations.' },
    { name: 'Product', icon: Package, description: 'Defining and evolving product strategies.' },
    { name: 'Design', icon: Paintbrush, description: 'Crafting user experiences and visuals.' },
    { name: 'Customer Support', icon: Headphones, description: 'Helping users and resolving queries.' },
    { name: 'Operations', icon: Settings, description: 'Streamlining processes and daily functions.' },
    { name: 'Legal', icon: Scale, description: 'Ensuring compliance and handling contracts.' },
    { name: 'Executive', icon: Crown, description: 'Overseeing leadership and strategic decisions.' },
    { name: 'Other', icon: MoreHorizontal, description: 'General roles not listed above.' }
  ];
  

  const mergedDepartments = departments.map(dep => {
    const details = departmentDetails.find(d => d.name === dep.name);
    return {
      id: dep._id,
      name: dep.name,
      icon: details?.icon,
      description: details?.description
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
        <div className="w-16 h-16 bg-white text-black rounded-full flex items-center animate-pulse-secure justify-center animate-pulse">
          <Shield className="w-8 h-8 text-secure-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secure-700 to-trust-700 p-4">
      <div className="w-full max-w-6xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center animate-pulse-secure">
            <Shield className="w-8 h-8 text-secure-500" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Select Your Department</h1>
          <p className="text-white/80">
            Choose the department you want to access. Your dashboard and available features will be customized based on your selection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mergedDepartments.map((department, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedDepartment === department.id ? 'ring-2 ring-white scale-105' : ''
              }`}
              onClick={() => handleDepartmentSelect(department.id)}
            >

              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  {/* ICON HERE */}
                  <div className="text-3xl mb-2">
                    <department.icon className="w-8 h-8" />
                  </div>

                  <ChevronRight className="text-white h-5 w-5" />
                </div>
                <CardTitle className="text-white">{department.name}</CardTitle>
              </CardHeader>

              <CardContent className="relative z-10">
                <CardDescription className="text-white/90">
                  {department.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>


        <div className="mt-8 text-center text-white/80 text-sm">
          <div>Zero Trust AI-Powered Security</div>
          <div>© {new Date().getFullYear()} ZeroSecure AI</div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSelection;
