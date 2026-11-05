import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../providers/AuthProvider';
import { signOut } from '../../services/auth/authService';
import { paths } from '../../routes/paths';

export default function RoleSetupPage() {
  const { user, role, pendingProfessionalRole, loading, refreshProfile, mfaRequired, mfaError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (!user) return <Navigate to={paths.login} replace />;
  if (mfaRequired || mfaError) return <Navigate to={paths.twoFactor} replace state={location.state} />;
  if (role && !pendingProfessionalRole) return <Navigate to="/app" replace />;

  const isPendingProfessional = Boolean(pendingProfessionalRole);
  const requestedLabel = pendingProfessionalRole ? pendingProfessionalRole[0].toUpperCase() + pendingProfessionalRole.slice(1) : '';

  return (
    <AuthShell
      seoTitle={isPendingProfessional ? 'Professional verification pending' : 'Workspace verification'}
      seoDescription={isPendingProfessional ? 'Your professional workspace is pending administrator verification.' : 'Your workspace is assigned after account verification.'}
      title={isPendingProfessional ? 'Professional verification pending.' : 'Workspace verification needed.'}
      description={isPendingProfessional ? `Your ${requestedLabel} application is waiting for administrator verification. Staff access remains closed until trusted account records are updated.` : 'Workspace roles are assigned from verified account records. You can’t grant yourself staff access here.'}
    >
      <Alert tone="warning" title={isPendingProfessional ? `${requestedLabel} verification pending` : 'No verified workspace is assigned'}>
        {isPendingProfessional ? 'Your account currently has patient-level security only. Contact your organization administrator when your professional verification is ready.' : 'Contact your organization administrator to verify your account. New patient accounts will be available after the database profile has been provisioned.'}
      </Alert>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => void refreshProfile()}>Check again</Button>
        <Button to={paths.contact}>Contact WellNest</Button>
        <Button variant="ghost" onClick={async () => { await signOut(); navigate(paths.login, { replace: true }); }}>
          Sign out
        </Button>
      </div>
    </AuthShell>
  );
}
