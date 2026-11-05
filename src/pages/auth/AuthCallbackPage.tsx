import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { clearGoogleSignIn, readGoogleSignIn } from '../../lib/authRedirect';
import { dashboardPathFor, isRouteAllowedForRole } from '../../services/auth/authService';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { paths } from '../../routes/paths';

export default function AuthCallbackPage() {
  const { user, role, pendingProfessionalRole, loading, mfaRequired, mfaError } = useAuth();
  const location = useLocation();
  const from = readGoogleSignIn()?.from;
  const params = new URLSearchParams(`${location.search.replace(/^\?/, '')}&${location.hash.replace(/^#/, '')}`);
  const canceled = params.get('error') === 'access_denied' || params.get('error_code') === 'access_denied';
  const hasError = params.has('error') || params.has('error_code');
  const destination = loading || hasError || !user ? null
    : mfaRequired || mfaError ? paths.twoFactor
      : pendingProfessionalRole || !role ? paths.roleSetup
      : from && isRouteAllowedForRole(from, role) ? from : dashboardPathFor(role);

  useEffect(() => {
    if (destination || (!loading && (hasError || !user))) clearGoogleSignIn();
  }, [destination, loading, hasError, user]);

  if (loading) return (
    <div id="auth-root" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <ShieldCheck size={30} strokeWidth={1.3} className="text-brand-700" />
      <h1 className="font-display text-4xl text-brand-900">Opening your workspace.</h1>
      <p className="max-w-sm text-xs leading-7 text-ink-500">Finishing your Google sign-in and checking your account’s portal access.</p>
      <Spinner size="lg" />
    </div>
  );

  if (destination) return <Navigate to={destination} replace state={destination === paths.twoFactor ? { from } : undefined} />;

  return (
    <AuthShell seoTitle="Complete sign-in" seoDescription="Finish signing in to your WellNest workspace."
      title={canceled ? 'Let’s try that again.' : 'We couldn’t finish sign-in.'}
      description={canceled ? 'Google sign-in was cancelled. You can try again or sign in using your email.' : 'Your session did not reach this website. Return to sign-in to try again. The Google return address must point to this version of WellNest.'}>
      <Button to={paths.login} fullWidth size="lg" rightIcon={<ArrowRight size={16} />}>Return to sign in</Button>
    </AuthShell>
  );
}
