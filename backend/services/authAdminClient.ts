import "../config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Used only for privileged auth operations (e.g. deleting a user's auth record).
// Do not use for regular request handling — see authClient.ts for that.
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for admin operations.");

export const authAdminClient: SupabaseClient["auth"] = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}).auth;