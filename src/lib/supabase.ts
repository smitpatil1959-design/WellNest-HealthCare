import { createClient } from '@supabase/supabase-js';

const url =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://rduoszzxehdrefgjvook.supabase.co';

const anonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_2KfAeboVRCzA_cmpIiMeAg_ILYjpp-o';

if (!url || !anonKey) {
  throw new Error(
    '[WellNest] Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.',
  );
}

/**
 * Singleton Supabase client.
 *
 * flowType is intentionally omitted (defaults to 'implicit') because PKCE is
 * designed for server-side / OAuth redirect flows and can cause 400 errors on
 * signInWithPassword when used with the newer sb_publishable_* key format.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
