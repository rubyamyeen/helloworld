import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Image = {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  url: string;
  is_common_use: boolean;
  profile_id: string;
  additional_context: string;
  is_public: boolean;
  image_description: string;
  celebrity_recognition: string;
};
