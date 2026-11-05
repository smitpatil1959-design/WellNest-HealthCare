const GOOGLE_INTENT_KEY = 'wellnest.google.return';
const GOOGLE_INTENT_LIFETIME = 30 * 60 * 1000;

export interface GoogleSignInIntent {
  origin: string;
  startedAt: number;
  from?: string;
}

/** A return location is navigation context only; it never assigns a role. */
export function safeWorkspaceReturn(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\/app(?:\/|$)/.test(value) || /[\\\r\n]/.test(value)) return undefined;
  const parsed = new URL(value, 'https://wellnest.invalid');
  if (parsed.origin !== 'https://wellnest.invalid' || !/^\/app(?:\/|$)/.test(parsed.pathname)) return undefined;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function googleCallbackUrl(origin: string): string {
  const current = new URL(origin);
  if (!['http:', 'https:'].includes(current.protocol)) throw new Error('Google sign-in requires a website address.');
  return new URL('/auth/callback', current.origin).href;
}

export function rememberGoogleSignIn(from?: string) {
  const intent: GoogleSignInIntent = {
    origin: window.location.origin,
    startedAt: Date.now(),
    from: safeWorkspaceReturn(from),
  };
  try { window.sessionStorage.setItem(GOOGLE_INTENT_KEY, JSON.stringify(intent)); } catch {
    // The callback can still open the account's verified dashboard without storage.
  }
}

export function readGoogleSignIn(): GoogleSignInIntent | null {
  try {
    // Preserve an in-progress sign-in across a browser-storage namespace change.
    const previousKey = Object.keys(window.sessionStorage).find(key => key !== GOOGLE_INTENT_KEY && key.endsWith('.google.return'));
    const raw = window.sessionStorage.getItem(GOOGLE_INTENT_KEY)
      ?? (previousKey ? window.sessionStorage.getItem(previousKey) : null);
    if (!raw) return null;
    const intent = JSON.parse(raw) as GoogleSignInIntent;
    const age = Date.now() - intent.startedAt;
    if (intent.origin !== window.location.origin || !Number.isFinite(age) || age < 0 || age > GOOGLE_INTENT_LIFETIME) {
      clearGoogleSignIn();
      return null;
    }
    if (previousKey) {
      window.sessionStorage.setItem(GOOGLE_INTENT_KEY, raw);
      window.sessionStorage.removeItem(previousKey);
    }
    return { origin: intent.origin, startedAt: intent.startedAt, from: safeWorkspaceReturn(intent.from) };
  } catch { return null; }
}

export function clearGoogleSignIn() {
  authReturnOnPageLoad = false;
  try {
    window.sessionStorage.removeItem(GOOGLE_INTENT_KEY);
    Object.keys(window.sessionStorage).filter(key => key.endsWith('.google.return')).forEach(key => window.sessionStorage.removeItem(key));
  } catch { /* Storage is optional. */ }
}

export function hasAuthReturnParameters(search: string, hash: string): boolean {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  if (fragment.get('type') === 'recovery') return false;
  return query.has('code') || query.has('error') || fragment.has('access_token') || fragment.has('error');
}

// Capture the callback marker before the authentication SDK cleans the address.
export let authReturnOnPageLoad = typeof window !== 'undefined'
  && hasAuthReturnParameters(window.location.search, window.location.hash);
