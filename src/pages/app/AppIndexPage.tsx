import { Navigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { Spinner } from '../../components/ui/Spinner';

export default function AppIndexPage() {
  const { user, role, pendingProfessionalRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-ink-400">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  if (pendingProfessionalRole) {
    return <Navigate to={paths.roleSetup} replace />;
  }

  if (!role) {
    return <Navigate to={paths.roleSetup} replace />;
  }

  return <Navigate to={dashboardPathFor(role)} replace />;
}
