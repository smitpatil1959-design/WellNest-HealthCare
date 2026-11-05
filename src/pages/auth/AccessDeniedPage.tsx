import { useLocation } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { AUTH_ROLE_LABELS } from '../../types/auth';

export default function AccessDeniedPage() {
  const { role } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from;

  return (
    <>
      <Seo title="Access denied" description="Your role cannot open that WellNest workspace." />
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">403</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl text-ink-900">That room is not on your badge.</h1>
        <p className="mt-4 max-w-md text-ink-500">
          {role ? `You are signed in as ${AUTH_ROLE_LABELS[role]}.` : 'You are signed in.'}{' '}
          {from ? `“${from}” belongs to a different role.` : 'This surface is reserved for another role.'}
        </p>
        <img src="/images/illustration-empty.png" alt="" className="my-8 h-36 w-36 object-contain" />
        <div className="flex flex-wrap justify-center gap-3">
          {role ? <Button to={dashboardPathFor(role)}>Go to my workspace</Button> : <Button to={paths.login}>Sign in</Button>}
          <Button to={paths.home} variant="outline">
            Home
          </Button>
        </div>
      </Container>
    </>
  );
}
