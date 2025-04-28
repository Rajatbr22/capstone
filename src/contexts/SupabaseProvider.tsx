
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface SupabaseContextType {
  isInitialized: boolean;
  hasError: boolean;
  errorDetails: string | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isInitialized: false,
  hasError: false,
  errorDetails: null,
});

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if Supabase is properly configured
    const checkSupabaseConfig = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setErrorDetails("Supabase not properly configured. Using mock data.");
          setHasError(true);
          setIsInitialized(true);
          return;
        }
        
        // Try to make a simple query to verify connection
        // Use count() instead of selecting actual data to avoid RLS issues
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error connecting to Supabase:', error);
          
          // Check if the error is due to missing environment variables or configuration
          if (error.message?.includes('URL') || error.message?.includes('key')) {
            const errorMsg = "Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables";
            setErrorDetails(errorMsg);
            toast({
              title: "Supabase Configuration Error",
              description: errorMsg,
              variant: "destructive",
            });
          } 
          // Check for policy recursion error - this is a specific error we're handling
          else if (error.code === '42P17' || (typeof error.message === 'string' && error.message.includes('infinite recursion'))) {
            const errorMsg = "Infinite recursion detected in policy. Please run the updated schema SQL from src/lib/supabase-schema.sql in your Supabase SQL Editor.";
            setErrorDetails(errorMsg);
            toast({
              title: "Supabase Policy Error",
              description: errorMsg,
              variant: "destructive",
              duration: 10000,
            });
            
            // Show additional instruction toast with delay
            setTimeout(() => {
              toast({
                title: "Schema Update Required",
                description: "The schema has been modified to fix recursive policies. Please run the SQL code from supabase-schema.sql in your Supabase SQL Editor.",
                duration: 10000,
              });
            }, 1000);
          }
          // Check if policy error (RLS)
          else if (error.code === '42501' || error.code === 'PGRST109') {
            const errorMsg = "Row-level security policy error. Please run the schema SQL from src/lib/supabase-schema.sql in your Supabase SQL Editor.";
            setErrorDetails(errorMsg);
            toast({
              title: "Supabase Schema Error",
              description: errorMsg,
              variant: "destructive",
            });
          }
          else {
            const errorMsg = "Could not connect to Supabase. Using mock data.";
            setErrorDetails(errorMsg);
            toast({
              title: "Supabase Connection Error",
              description: errorMsg,
              variant: "destructive",
            });
          }
          
          setHasError(true);
          // Set initialized to true anyway to allow the app to function with mock data
          setIsInitialized(true);
        } else {
          setIsInitialized(true);
          setHasError(false);
        }
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        setErrorDetails("Unexpected error initializing Supabase");
        setHasError(true);
        toast({
          title: "Supabase Initialization Error",
          description: "Using mock data instead.",
          variant: "destructive",
        });
        // Set initialized to true anyway to allow the app to function with mock data
        setIsInitialized(true);
      }
    };
    
    checkSupabaseConfig();
  }, []);
  
  return (
    <SupabaseContext.Provider value={{ isInitialized, hasError, errorDetails }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseStatus = () => useContext(SupabaseContext);
