import type { User } from '@supabase/supabase-js';
import supabase from '../../lib/supabase';
import type { UserRole } from '../../types/roles';
import { normalizeRole, isValidUserRole } from '../../types/roles';
export { USER_ROLES } from '../../types/roles';
import { type AuthProfile, type AuthUserMetadata } from '../../types/auth';
import { paths } from '../../routes/paths';

export function clearActiveSession() {
  try {
    sessionStorage.clear();
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
}

export function isUserRole(value: unknown): value is UserRole {
  return isValidUserRole(value);
}

type ProfessionalRole = Exclude<UserRole, 'patient' | 'administrator'>;

export const PROFESSIONAL_ROLES = Object.freeze([
  'doctor',
  'laboratory',
  'hospital',
  'pharmacy',
  'insurance',
] satisfies ProfessionalRole[]);

/**
 * A pending role only controls the safe waiting screen. It never grants
 * authorization; staff access still comes from the trusted database profile.
 */
export function getPendingProfessionalRole(user: User | null): UserRole | null {
  const requestedRole = user?.user_metadata?.requested_role;
  return typeof requestedRole === 'string' && PROFESSIONAL_ROLES.includes(requestedRole as ProfessionalRole)
    ? requestedRole as ProfessionalRole
    : null;
}

export interface DbProfileRow {
  id?: string;
  user_id?: string;
  role?: string;
  role_verified?: boolean;
  full_name?: string;
  organization?: string;
  organization_id?: string;
  hospital_id?: string;
  phone?: string;
  language?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  blood_group?: string;
  allergies?: string[];
  conditions?: string[];
  medications_list?: string[];
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  professional_title?: string;
  license_number?: string;
  specialty?: string;
  onboarding_completed?: boolean;
  [key: string]: unknown;
}

/**
 * Reads the sole source of verified roles. A missing profile remains unassigned.
 */
export async function fetchDbProfile(userId: string): Promise<DbProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .abortSignal(AbortSignal.timeout(10_000))
    .maybeSingle();
  if (error) throw error;
  return (data as DbProfileRow | null) ?? null;
}

/**
 * Resolves a workspace only from an explicitly verified database profile.
 *
 * User metadata, email, and local storage never grant workspace access.
 */
export function resolveUserRole(user: User | null, dbProfile?: DbProfileRow | null): UserRole | null {
  if (!user) return null;

  // Patients do not require staff verification or organization membership.
  // Every staff role still requires an explicitly verified database profile.
  if (dbProfile?.role) {
    const norm = normalizeRole(dbProfile.role);
    if (norm === 'patient') return norm;
    if (norm && dbProfile.role_verified === true) return norm;
  }

  // Auth metadata, user metadata, and local storage never grant workspace access.
  return null;
}

/**
 * Backward compatibility alias for inferRole, powered by resolveUserRole.
 */
export function inferRole(user: User | null): UserRole | null {
  return resolveUserRole(user);
}

export function toProfile(
  user: User,
  dbProfile?: DbProfileRow | null,
): AuthProfile | null {
  const meta = (user.user_metadata ?? {}) as AuthUserMetadata;
  const role = resolveUserRole(user, dbProfile);

  if (!role) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: role === 'doctor'
      ? (dbProfile?.full_name as string) || 'Verified doctor'
      : (dbProfile?.full_name as string) ||
        meta.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        'WellNest member',
    role,
    roleVerified: Boolean(dbProfile?.role_verified),
    organization: (dbProfile?.organization as string) || '',
    organizationId: (dbProfile?.organization_id as string) || '',
    phone: (dbProfile?.phone as string) || '',
    language: (dbProfile?.language as string) || 'en',
    avatarUrl: (dbProfile?.avatar_url as string) || '',
    emailVerified: Boolean(user.email_confirmed_at),
    twoFactorEnabled: false,
    notifications: { email: true, sms: false, product: true },
    dateOfBirth: dbProfile?.date_of_birth || '',
    gender: dbProfile?.gender || '',
    address: dbProfile?.address || '',
    bloodGroup: dbProfile?.blood_group || '',
    allergies: dbProfile?.allergies || [],
    conditions: dbProfile?.conditions || [],
    medicationsList: dbProfile?.medications_list || [],
    emergencyContactName: dbProfile?.emergency_contact_name || '',
    emergencyContactRelation: dbProfile?.emergency_contact_relation || '',
    emergencyContactPhone: dbProfile?.emergency_contact_phone || '',
    professionalTitle: dbProfile?.professional_title || '',
    licenseNumber: dbProfile?.license_number || '',
    specialty: dbProfile?.specialty || '',
    onboardingCompleted: dbProfile?.onboarding_completed || false,
  };
}

/**
 * Sign in with email + password using Supabase Auth.
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}



export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  organization: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        requested_role: input.role,
        organization: input.organization,
      },
    },
  });
  if (error) throw error;

  return data;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function resendSignupEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}

export async function updateAccount(data: AuthUserMetadata) {
  const { error } = await supabase.auth.updateUser({ data });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
  clearActiveSession();
  // Purge all WellNest-specific localStorage keys so that stale role/profile data
  // from a previous session cannot bleed into the next user's login.
  try {
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('wellnest.') || k.endsWith('.remember.email'));
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
}

export function dashboardPathFor(role: UserRole | null | undefined): string {
  if (!role) return paths.roleSetup;
  const map: Record<UserRole, string> = {
    patient: '/app/patient',
    doctor: '/app/doctor',
    hospital: '/app/hospital',
    laboratory: '/app/laboratory',
    pharmacy: '/app/pharmacy',
    insurance: '/app/insurance',
    administrator: '/app/admin',
  };
  return map[role] || paths.roleSetup;
}

export function isRouteAllowedForRole(
  pathname: string,
  role: UserRole | null | undefined,
): boolean {
  if (!role) return false;
  const cleanPath = pathname.toLowerCase();

  // Global authenticated surfaces
  if (
    cleanPath === '/app' ||
    cleanPath === '/app/' ||
    cleanPath.startsWith('/app/profile') ||
    cleanPath.startsWith('/app/settings') ||
    cleanPath.startsWith('/app/support') ||
    cleanPath.startsWith('/app/lookup')
  ) {
    return true;
  }

  // Scoped role paths
  if (role === 'patient') return cleanPath.startsWith('/app/patient');
  if (role === 'doctor') return cleanPath.startsWith('/app/doctor');
  if (role === 'hospital') return cleanPath.startsWith('/app/hospital');
  if (role === 'laboratory') return cleanPath.startsWith('/app/laboratory');
  if (role === 'pharmacy') return cleanPath.startsWith('/app/pharmacy');
  if (role === 'insurance') return cleanPath.startsWith('/app/insurance');
  if (role === 'administrator') return cleanPath.startsWith('/app/admin');

  return false;
}
