import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pbrxwzdgiolzoyyroluf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicnh3emRnaW9sem95eXJvbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3ODE3MzgsImV4cCI6MjEwODM1NzczOH0.KeIgBYGg-wknn_JmUR_ZYRD6Myz5X5y-_d3EqxBre_I";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
