/**
 * Converts a raw Supabase / network error into a human-readable message.
 *
 * Differentiates cleanly between:
 * - Invalid email/password
 * - Account does not exist
 * - Email confirmation required
 * - Account creation failed
 * - Network/server error
 * - Session expired / invalid token
 * - Role missing
 * - Unauthorized workspace
 */
export function toAuthMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const lower = raw.toLowerCase();

  // Always log the real error in dev so problems can be diagnosed quickly.
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.error('[WellNest auth error]', error);
  }

  // 1. Invalid email/password
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email/password. Please check your credentials and try again.';
  }

  // 2. Account does not exist
  if (
    lower.includes('user not found') ||
    lower.includes('no user') ||
    lower.includes('account not found') ||
    lower.includes('user does not exist')
  ) {
    return 'Account does not exist. Please check your email or create a new account.';
  }

  // 3. Email confirmation required
  if (lower.includes('email not confirmed') || lower.includes('confirmation required')) {
    return 'Email confirmation required. Please check your inbox for the verification link.';
  }

  // 4. Account creation failed / already registered
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already registered')
  ) {
    return 'Account creation failed: An account with this email already exists. Sign in instead.';
  }

  // 5. Network / server error
  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('load failed') ||
    lower.includes('networkerror') ||
    lower.includes('fetch error') ||
    lower.includes('server error') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504')
  ) {
    return 'Network/server error. Please check your internet connection and try again.';
  }

  // 6. Session expired / invalid token
  if (
    lower.includes('jwt expired') ||
    lower.includes('session expired') ||
    lower.includes('token expired') ||
    lower.includes('refresh_token_not_found')
  ) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  // 7. Role missing / unassigned
  if (lower.includes('role missing') || lower.includes('no role assigned') || lower.includes('role required')) {
    return 'Your account does not have a designated healthcare role. Please assign a role to proceed.';
  }

  // 8. Organization missing
  if (lower.includes('organization missing') || lower.includes('organization required')) {
    return 'Organization details are required for this healthcare role.';
  }

  // 9. Unauthorized workspace / access denied
  if (lower.includes('unauthorized workspace') || lower.includes('access denied') || lower.includes('not authorized')) {
    return 'You do not have permission to access that workspace.';
  }

  // 10. Rate limiting
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  // 11. OTP / code errors
  if (lower.includes('otp') || lower.includes('token') || lower.includes('expired')) {
    return 'That code is invalid or has expired. Please request a new one.';
  }

  // Fallback — show the actual error message so nothing is silently swallowed
  return raw || 'An unexpected authentication error occurred. Please try again.';
}
