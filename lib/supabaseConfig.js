import { createClient } from "@supabase/supabase-js";
import env from "@/lib/envConfig";

const supabaseUrl = env.public.supabaseUrl;
const supabaseServiceKey = env.server.supabaseServiceKey;

export const supabaseConfig =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

export const supabase = supabaseConfig;
