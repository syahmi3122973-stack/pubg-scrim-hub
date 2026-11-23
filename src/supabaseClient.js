import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wfktlfhxqebvbwrjgmox.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mFQtmU1SN-adbcwzvCv0KQ__f-kmmGW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
