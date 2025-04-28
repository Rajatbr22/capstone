
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


const hasValidCredentials = supabaseUrl !== '' && supabaseAnonKey !== '';


if (!hasValidCredentials) {
  console.warn('Missing Supabase environment variables. Application will use mock data instead of connecting to Supabase.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);


export const isSupabaseConfigured = () => hasValidCredentials;
export const getSupabaseURL = () => supabaseUrl;


export const bypassRLS = async () => {
  if (!hasValidCredentials) return;
  try {
    if (import.meta.env.VITE_SUPABASE_SERVICE_KEY) {
      return createClient(
        supabaseUrl,
        import.meta.env.VITE_SUPABASE_SERVICE_KEY,
        {
          auth: {
            persistSession: false,
          }
        }
      );
    }
  } catch (error) {
    console.error('Failed to bypass RLS:', error);
  }
  return supabase;
};
