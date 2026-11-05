import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { paths } from '../../routes/paths';
import { resendSignupEmail } from '../../services/auth/authService';
import { useAuthForm } from '../../hooks/useAuthForm';

export default function VerifyEmailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email ?? '';
  const [resent, setResent] = useState(false);
  const { serverError, busy, run } = useAuthForm();

  return (
    <AuthShell
      seoTitle="Verify email"
      seoDescription="Confirm your email to finish creating a WellNest account."
      title="Check your inbox."
      description="We sent a verification link. Confirm the address before you enter a clinical workspace."
    >
      {serverError ? (
        <Alert tone="error" title="Could not resend" className="mb-5">
          {serverError}
        </Alert>
      ) : null}
      {resent ? <Alert tone="success" title="Sent again" className="mb-5">Another verification email is on the way.</Alert> : null}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-5 text-sm leading-6 text-ink-600 shadow-2xs">
        Look for a message from WellNest{email ? ` at ${email}` : ''}. The link expires. After you confirm, return here and sign in.
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          fullWidth
          loading={busy}
          disabled={!email}
          onClick={() =>
            run(async () => {
              await resendSignupEmail(email);
              setResent(true);
            })
          }
        >
          Resend email
        </Button>
        <Button to={paths.login} variant="outline" fullWidth>
          Back to sign in
        </Button>
      </div>
      <p className="mt-6 text-sm text-ink-500">
        Prefer a code instead?{' '}
        <Link to={paths.verifyOtp} className="font-semibold text-brand-700">
          Use OTP
        </Link>
      </p>
    </AuthShell>
  );
}
