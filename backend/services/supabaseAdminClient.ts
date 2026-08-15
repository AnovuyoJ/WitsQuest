import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env"
  );
}

// This client uses the secret/service role key — it bypasses Row Level Security
// and should NEVER be imported into frontend code or exposed to the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});