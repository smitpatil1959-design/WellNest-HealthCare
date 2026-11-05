import supabase from './supabase';
import { clearGoogleSignIn, googleCallbackUrl, rememberGoogleSignIn } from './authRedirect';

/**
 * Initiates the official Supabase Auth OAuth flow for Google.
 */
export async function signInWithGoogle(from?: string) {
  // Always finish on this build's callback, never a marketing page or another host.
  const target = googleCallbackUrl(window.location.origin);
  rememberGoogleSignIn(from);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: target,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    clearGoogleSignIn();
    throw error;
  }

  return data;
}
