import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Use environment variables in production, but fall back to direct values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://liuaozuvkmvanmchndzl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Missing Supabase API key. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
