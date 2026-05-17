import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co'
);

if (!supabaseConfigured) {
  console.info(
    '[CyberVolt] Supabase not configured — running with built-in Libyan demo data. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect a live database.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);
