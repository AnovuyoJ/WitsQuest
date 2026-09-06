// Runtime configuration is expected to be loaded by the app entrypoint or environment.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase is used only for identity verification. Application data uses database.ts.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY for authentication.");
export const authClient: SupabaseClient["auth"] = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
}).auth;
