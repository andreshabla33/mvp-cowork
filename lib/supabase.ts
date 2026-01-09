
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcryrsdyrzotjqdxcwtp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v3UuFjAjA8fBRNp7LB2MsQ_buEVoHDF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
