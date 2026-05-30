import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./http.js";
function createSupabaseAdminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return { user: null, error: "Missing bearer token." };
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "Invalid session." };
  }
  return { user: data.user, error: null };
}
export {
  createSupabaseAdminClient,
  getAuthenticatedUser
};
