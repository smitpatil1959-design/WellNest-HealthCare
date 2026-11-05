import { consentCategoriesForRole } from '../../shared/consent-categories.js';

// Universal Alphanumeric Alphabet excluding easily confused characters (0, O, 1, I)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Returns a public, secure web URL for the QR code that resolves to the
 * patient's verified health profile without exposing sensitive medical data directly.
 */
export function qrVerificationUrl(healthId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_APP_URL;
  if (!origin) throw new Error('A configured website address is required to generate a Health ID link.');
  return `${origin}/verify/health-id/${encodeURIComponent(healthId.trim())}`;
}

/**
 * Encodes the QR code with the secure verification URL.
 */
export function qrPayload(healthId: string): string {
  return qrVerificationUrl(healthId);
}

/**
 * Normalizes and formats raw Health ID strings into the canonical VY-XXXX-XXXX format.
 */
export function formatHealthId(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.startsWith('VY')) {
    const remainder = clean.slice(2);
    if (remainder.length === 8) {
      return `VY-${remainder.slice(0, 4)}-${remainder.slice(4, 8)}`;
    }
  }
  return raw.trim().toUpperCase();
}

/**
 * Generates a random human-friendly Health ID in the format: VY-7K42-91PM
 */
export function generateRandomHealthId(): string {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i += 1) {
    part1 += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    part2 += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `VY-${part1}-${part2}`;
}

/**
 * Generates a permanent, deterministic Health ID from a user ID seed.
 * Guarantees that a given user always receives the exact same stable Health ID.
 */
export function generateDeterministicHealthId(seed: string): string {
  let hash = 0;
  const str = String(seed || '');
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i += 1) {
    const idx1 = Math.abs(Math.sin(hash + i * 7) * 10000) % ALPHABET.length | 0;
    const idx2 = Math.abs(Math.cos(hash + i * 13) * 10000) % ALPHABET.length | 0;
    part1 += ALPHABET[idx1];
    part2 += ALPHABET[idx2];
  }
  return `VY-${part1}-${part2}`;
}

export function roleCategories(role?: string | null) {
  return consentCategoriesForRole(role);
}
