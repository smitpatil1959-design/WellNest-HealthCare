import supabase, { isDbConfigured } from './db-client.js';
import { requiresSecondFactor } from '../shared/mfa.js';

export function normalizeApiRole(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().toLowerCase().replace(/[-_\s]+/g, '_');
  if (cleaned === 'patient' || cleaned === 'patients') return 'patient';
  if (cleaned === 'doctor' || cleaned === 'doctors' || cleaned === 'physician' || cleaned === 'clinician') return 'doctor';
  if (cleaned === 'hospital' || cleaned === 'hospitals' || cleaned === 'clinic' || cleaned === 'hospital_admin') return 'hospital';
  if (cleaned === 'laboratory' || cleaned === 'laboratories' || cleaned === 'lab' || cleaned === 'labs') return 'laboratory';
  if (cleaned === 'pharmacy' || cleaned === 'pharmacies' || cleaned === 'pharmacist' || cleaned === 'chemist') return 'pharmacy';
  if (cleaned === 'insurance' || cleaned === 'insurer' || cleaned === 'payer') return 'insurance';
  if (
    cleaned === 'administrator' ||
    cleaned === 'admin' ||
    cleaned === 'super_admin' ||
    cleaned === 'superadmin'
  ) {
    return 'administrator';
  }
  return null;
}

export const VERIFIED_STAFF_ROLES = Object.freeze([
  'doctor',
  'hospital',
  'laboratory',
  'pharmacy',
  'insurance',
]);

export function hasVerifiedRole(auth, roles) {
  return auth?.authenticated === true && auth.roleVerified === true && roles.includes(auth.role);
}

/**
 * Verifies Supabase Bearer token and resolves authentic user ID, real role, and organization.
 * Never trusts frontend-supplied roles.
 */
export async function verifyAuth(req, { allowMfaPending = false } = {}) {
  if (!isDbConfigured || !supabase) {
    return { authenticated: false, error: 'Backend database service is unavailable.', status: 503 };
  }
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return {
      authenticated: false,
      error: 'Missing Authorization header with Bearer token',
      status: 401,
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return {
        authenticated: false,
        error: 'Invalid or expired session token',
        status: 401,
      };
    }

    const user = data.user;
    let claims = null;
    try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { /* Invalid claims cannot satisfy MFA. */ }
    const mfaPending = requiresSecondFactor(user, claims);
    if (mfaPending && !allowMfaPending) {
      return { authenticated: false, error: 'Verify your authenticator code to continue.', status: 403, code: 'MFA_REQUIRED' };
    }
    let role = null;
    let roleVerified = false;
    let organization = '';
    let organizationId = '';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, role_verified, organization, organization_id, full_name, account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return {
        authenticated: false,
        error: 'Verified account profile is unavailable.',
        status: 503,
      };
    }

    if (profile?.account_status === 'suspended') {
      return { authenticated: false, error: 'Your account is suspended. Contact support.', status: 403 };
    }

    // Patients do not require staff verification or organization membership.
    // Staff accounts require an explicitly verified database profile; metadata
    // and browser-supplied roles never establish authorization.
    const profileRole = normalizeApiRole(profile?.role);
    if (profileRole === 'patient') {
      role = profileRole;
    } else if (profile?.role_verified === true) {
      role = profileRole;
      roleVerified = Boolean(role);
      organization = profile.organization || '';
      organizationId = profile.organization_id || '';
    }

    const userMeta = user.user_metadata || {};

    const fullName = role === 'doctor'
      ? profile?.full_name || 'Verified doctor'
      : profile?.full_name ||
        userMeta.full_name ||
        userMeta.name ||
        user.email?.split('@')[0] ||
        'Healthcare Member';

    return {
      authenticated: true,
      user,
      userId: user.id,
      email: user.email,
      role,
      roleVerified,
      fullName,
      organization,
      organizationId,
      mfaPending,
    };
  } catch (err) {
    console.error("[auth-guard verification error]", err?.code || 'UNAVAILABLE');
    return {
      authenticated: false,
      error: 'Authentication could not be verified.',
      status: 401,
    };
  }
}
