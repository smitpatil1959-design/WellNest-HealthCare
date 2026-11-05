import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { fetchDbProfile, getPendingProfessionalRole, resolveUserRole, toProfile } from '../services/auth/authService';
import type { AuthProfile } from '../types/auth';
import type { UserRole } from '../types/roles';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  role: UserRole | null;
  pendingProfessionalRole: UserRole | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaError: string;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maximum ms to wait for Supabase session initialization before giving up. */
const AUTH_INIT_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [pendingProfessionalRole, setPendingProfessionalRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaError, setMfaError] = useState('');

  /**
   * Tracks whether the very first auth initialization has completed.
   * Prevents onAuthStateChange from re-entering loading on subsequent events.
   */
  const initDone = useRef(false);
  const syncVersion = useRef(0);

  const syncUserState = useCallback(async (nextSession: Session | null, nextUser: User | null) => {
    const currentVersion = ++syncVersion.current;
    setSession(nextSession);
    setUser(nextUser);
    setMfaRequired(false);
    setMfaError('');

    if (!nextUser) {
      setProfileLoading(false);
      setProfile(null);
      setRole(null);
      setPendingProfessionalRole(null);
      console.log('[WellNest Auth] User resolved: unauthenticated');
      return;
    }

    setProfileLoading(true);
    // Keep every workspace closed until the verified database profile is read.
    setRole(null);
    setProfile(null);
    setPendingProfessionalRole(null);

    // Async path: enrich from database profile table if provisioned
    try {
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(nextSession?.access_token);
      if (currentVersion !== syncVersion.current) return;
      if (assurance.error) { setMfaError('Account security could not be checked. Retry before opening your workspace.'); return; }
      const needsSecondFactor=assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2';
      setMfaRequired(needsSecondFactor);
      if(needsSecondFactor)return;
      const dbProfile = await fetchDbProfile(nextUser.id);
      if (currentVersion !== syncVersion.current) return;
      if (dbProfile) {
        const enrichedRole = resolveUserRole(nextUser, dbProfile);
        const enrichedProfile = toProfile(nextUser, dbProfile);
        setRole(enrichedRole);
        setPendingProfessionalRole(enrichedRole === 'patient' ? getPendingProfessionalRole(nextUser) : null);
        if (enrichedProfile) setProfile(enrichedProfile);
      } else {
        setRole(null);
        setProfile(null);
        setPendingProfessionalRole(null);
      }
    } catch {
      if (currentVersion !== syncVersion.current) return;
      setRole(null);
      setProfile(null);
      setPendingProfessionalRole(null);
      console.warn('[WellNest Auth] Verified profile could not be loaded. Workspace access remains closed.');
    } finally {
      if (currentVersion === syncVersion.current) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    /**
     * Safety net: unconditionally clears loading state if the Supabase SDK
     * hangs beyond AUTH_INIT_TIMEOUT_MS (paused project, Web Locks deadlock, etc.).
     */
    const safetyTimer = setTimeout(() => {
      if (mounted && !initDone.current) {
        console.warn(
          '[WellNest Auth] Initialization timed out after', AUTH_INIT_TIMEOUT_MS,
          'ms. Check Supabase project status. Clearing loading state.',
        );
        initDone.current = true;
        setLoading(false);
      }
    }, AUTH_INIT_TIMEOUT_MS);

    async function init() {
      console.log('[WellNest Auth] Starting...');
      try {
        /**
         * ROOT CAUSE FIX:
         * supabase.auth.getSession() acquires a Web Lock (navigator.locks.request)
         * and may fire a token-refresh HTTP request. If the Supabase project is
         * paused (free-tier hibernation) or unreachable, that refresh call hangs
         * indefinitely � the lock is never released, INITIAL_SESSION never fires,
         * and setLoading(false) is never called => infinite spinner.
         *
         * Wrapping in Promise.race guarantees we always exit the loading state.
         */
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`supabase.auth.getSession() timed out after ${AUTH_INIT_TIMEOUT_MS}ms`)),
              AUTH_INIT_TIMEOUT_MS,
            ),
          ),
        ]);

        if (!mounted) return;
        console.log('[WellNest Auth] Session resolved:', sessionResult.data.session ? 'authenticated' : 'unauthenticated');
        await syncUserState(sessionResult.data.session, sessionResult.data.session?.user ?? null);
      } catch (err) {
        console.error('[WellNest Auth] Initialization error:', err);
        if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRole(null);
          setPendingProfessionalRole(null);
        }
      } finally {
        if (mounted && !initDone.current) {
          initDone.current = true;
          clearTimeout(safetyTimer);
          setLoading(false);
          console.log('[WellNest Auth] Loading complete.');
        }
      }
    }

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION if init() already handled the session
      if (event === 'INITIAL_SESSION' && initDone.current) return;

      console.log('[WellNest Auth] Auth state change:', event);
      // Do not await Supabase profile queries inside its auth callback. The SDK
      // holds an internal lock while dispatching auth events; defer database
      // work to the next task to avoid lock re-entry/deadlocks.
      setTimeout(() => {
        if (!mounted) return;
        void syncUserState(next, next?.user ?? null).finally(() => {
          // If init() is still in-flight, this event can complete first load.
          if (!mounted || initDone.current) return;
          initDone.current = true;
          clearTimeout(safetyTimer);
          setLoading(false);
          console.log('[WellNest Auth] Loading complete (via auth state change).');
        });
      }, 0);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.subscription.unsubscribe();
    };
  }, [syncUserState]);

  const refreshProfile = useCallback(async () => {
    console.log('[WellNest Auth] Refreshing profile...');
    try {
      const { data: freshSession } = await supabase.auth.getSession();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await syncUserState(freshSession.session, data.user);
        console.log('[WellNest Auth] Profile refreshed.');
      } else {
        await syncUserState(null, null);
      }
    } catch (err) {
      console.error('[WellNest Auth] refreshProfile error:', err);
    }
  }, [session, syncUserState]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      pendingProfessionalRole,
      loading: loading || profileLoading,
      mfaRequired,
      mfaError,
      refreshProfile,
    }),
    [user, session, profile, role, pendingProfessionalRole, loading, profileLoading, mfaRequired, mfaError, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- provider hook shares its context module.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
