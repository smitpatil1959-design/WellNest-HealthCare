const REMEMBER_KEY = 'wellnest.remember.email';

export function readRememberedEmail() {
  const current = localStorage.getItem(REMEMBER_KEY);
  if (current !== null) return current;
  const previousKey = Object.keys(localStorage).find(key => key.endsWith('.remember.email'));
  const email = previousKey ? localStorage.getItem(previousKey) ?? '' : '';
  if (previousKey) {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    localStorage.removeItem(previousKey);
  }
  return email;
}

export function writeRememberedEmail(email: string | null) {
  Object.keys(localStorage).filter(key => key.endsWith('.remember.email')).forEach(key => localStorage.removeItem(key));
  if (email) localStorage.setItem(REMEMBER_KEY, email);
}
