import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { paths } from '../../routes/paths';
import { resetSchema, type ResetValues } from '../../services/auth/schemas';
import { updatePassword } from '../../services/auth/authService';
import { useAuthForm } from '../../hooks/useAuthForm';
import { useToast } from '../../providers/ToastProvider';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { serverError, busy, run } = useAuthForm();
  const form = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = (values: ResetValues) =>
    run(async () => {
      await updatePassword(values.password);
      push({ tone: 'success', title: 'Password updated', description: 'Use your new password next time you sign in.' });
      navigate(paths.login, { replace: true });
    });

  return (
    <AuthShell
      seoTitle="Reset password"
      seoDescription="Choose a new password for your WellNest workspace."
      title="Choose a new password."
      description="Open this page from the email we sent. Then set a password you do not reuse elsewhere."
    >
      {serverError ? (
        <Alert tone="error" title="Could not update password" className="mb-5">
          {serverError}
        </Alert>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <PasswordField label="New password" autoComplete="new-password" error={form.formState.errors.password?.message} {...form.register('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} {...form.register('confirmPassword')} />
        <Button type="submit" size="lg" fullWidth loading={busy}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
