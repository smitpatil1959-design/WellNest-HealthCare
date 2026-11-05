import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dbConfigurationError = !url
  ? 'SUPABASE_URL or VITE_SUPABASE_URL'
  : !key
    ? 'SUPABASE_SERVICE_ROLE_KEY'
    : null;
export const isDbConfigured = Boolean(url && key);

if (dbConfigurationError) {
  console.error(`[db-client] Missing server environment variable: ${dbConfigurationError}`);
}

// Keep serverless modules loadable so configuration failures can be returned
// as JSON by the API handler instead of a platform HTML error page.
const supabase = isDbConfigured ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null;

export default supabase;
