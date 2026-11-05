import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { paths } from '../../routes/paths';
import { forgotSchema, type ForgotValues } from '../../services/auth/schemas';
import { requestPasswordReset } from '../../services/auth/authService';
import { useAuthForm } from '../../hooks/useAuthForm';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { serverError, busy, run } = useAuthForm();
  const form = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = (values: ForgotValues) =>
    run(async () => {
      await requestPasswordReset(values.email);
      setSent(true);
    });

  return (
    <AuthShell
      seoTitle="Forgot password"
      seoDescription="Reset your WellNest password."
      title="Reset your password."
      description="We will send a secure link to your email. The link expires, and it only works on this device once opened."
    >
      {serverError ? (
        <Alert tone="error" title="Could not send reset" className="mb-5">
          {serverError}
        </Alert>
      ) : null}
      {sent ? (
        <Alert tone="success" title="Check your inbox">
          If an account exists for that email, a reset link is on its way. Then continue on the reset page.
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Input label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register('email')} />
          <Button type="submit" size="lg" fullWidth loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm text-ink-500">
        <Link to={paths.login} className="font-semibold text-brand-700">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
