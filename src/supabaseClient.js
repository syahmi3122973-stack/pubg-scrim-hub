import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfktlfhxqebvbwrjgmox.supabase.co';
const supabaseAnonKey = 'sb_publishable_mFQtmU1SN-adbcwzvCv0KQ__f-kmmGW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);