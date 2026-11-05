import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor, isRouteAllowedForRole } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { Spinner } from '../ui/Spinner';

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, role, pendingProfessionalRole, loading, mfaRequired, mfaError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user && (mfaRequired || mfaError)) return <Navigate to={paths.twoFactor} replace state={location.state} />;

  if (user && pendingProfessionalRole) {
    return <Navigate to={paths.roleSetup} replace />;
  }

  if (user && role) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && isRouteAllowedForRole(from, role) ? from : dashboardPathFor(role)} replace />;
  }

  if (user && !role) {
    return <Navigate to={paths.roleSetup} replace />;
  }

  return children;
}
