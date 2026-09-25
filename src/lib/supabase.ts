import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!hasSupabaseConfig) {
    return null;
  }

  if (!client) {
    client = createClient(env.supabaseUrl!, env.supabaseAnonKey!);
  }

  return client;
}
