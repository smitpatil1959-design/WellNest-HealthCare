import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { OtpInput } from '../../components/auth/OtpInput';
import { sendEmailOtp, verifyEmailOtp, dashboardPathFor, fetchDbProfile, resolveUserRole } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { useAuthForm } from '../../hooks/useAuthForm';
import { useToast } from '../../providers/ToastProvider';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { serverError, setServerError, busy, run } = useAuthForm();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      seoTitle="One-time code"
      seoDescription="Sign in to WellNest with a one-time email code."
      title="Enter a one-time code."
      description="We will email a short code. Use it within a few minutes. This is also the pattern for two-factor challenges."
    >
      {serverError ? (
        <Alert tone="error" title="Verification failed" className="mb-5">
          {serverError}
        </Alert>
      ) : null}
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!sent) {
            run(async () => {
              await sendEmailOtp(email);
              setSent(true);
              setServerError('');
            });
            return;
          }
          run(async () => {
            const result = await verifyEmailOtp(email, code);
            if (result.user) {
              push({ tone: 'success', title: 'Verified', description: 'Opening your workspace.' });
              const dbProfile = await fetchDbProfile(result.user.id);
              const nextRole = resolveUserRole(result.user, dbProfile);
              if (nextRole) {
                navigate(dashboardPathFor(nextRole), { replace: true });
              } else {
                navigate(paths.roleSetup, { replace: true });
              }
            }
          });
        }}
      >
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        {sent ? (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">Code</p>
            <OtpInput value={code} onChange={setCode} />
          </div>
        ) : null}
        <Button type="submit" size="lg" fullWidth loading={busy}>
          {sent ? 'Verify code' : 'Send code'}
        </Button>
      </form>
    </AuthShell>
  );
}
