import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Spinner } from '../ui/Spinner';
import { paths } from '../../routes/paths';
import type { UserRole } from '../../types/roles';

export function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: UserRole[];
}) {
  const { user, role, pendingProfessionalRole, profile, loading, mfaRequired, mfaError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status">
        <Spinner size="lg" />
        <p className="text-sm text-ink-400">Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  if (mfaRequired || mfaError) {
    return <Navigate to={paths.twoFactor} replace state={{ from: location.pathname }} />;
  }

  if (pendingProfessionalRole) {
    return <Navigate to={paths.roleSetup} replace state={{ from: location.pathname }} />;
  }

  if (location.pathname.startsWith('/app/') && !role) {
    return <Navigate to={paths.roleSetup} replace state={{ from: location.pathname }} />;
  }

  if (
    role && role !== 'patient' && role !== 'administrator' && profile && profile.roleVerified !== true && profile.onboardingCompleted !== true &&
    location.pathname.startsWith('/app/') &&
    !location.pathname.startsWith('/app/profile') &&
    !location.pathname.startsWith('/app/settings')
  ) {
    return <Navigate to="/app/profile" replace state={{ from: location.pathname }} />;
  }

  // If route is restricted to specific roles but user has no assigned role yet
  if (allow && !role) {
    return <Navigate to={paths.roleSetup} replace state={{ from: location.pathname }} />;
  }

  // If user role is not in the allowed roles for this portal/route
  if (allow && role && !allow.includes(role)) {
    return <Navigate to={paths.accessDenied} replace state={{ from: location.pathname, role }} />;
  }

  return children;
}
