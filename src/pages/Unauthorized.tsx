
import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const Unauthorized: React.FC = () => {
  return (
    <Layout requireAuth={true} requiredRole="user">
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-6 text-center max-w-md">
          You don't have permission to access this resource.
          Please contact your administrator for assistance.
        </p>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/contact-admin">Contact Administrator</Link>
          </Button>
        </div>
        
        <div className="mt-8 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 max-w-md">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Zero Trust Security</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                This is an example of Zero Trust security in action. Access is denied based on your role permissions, 
                not just your authentication status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Unauthorized;
