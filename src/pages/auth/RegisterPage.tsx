import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { paths } from '../../routes/paths';
import { registerSchema, type RegisterValues } from '../../services/auth/schemas';
import { signInWithPassword, signUpWithPassword } from '../../services/auth/authService';
import type { UserRole } from '../../types/roles';
import { useAuthForm } from '../../hooks/useAuthForm';

// Staff accounts are requests only; a privileged administrator must verify them.
const REGISTRATION_ROLES: { value: UserRole; label: string }[] = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'insurance', label: 'Insurance' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { serverError, busy, run } = useAuthForm();
  const requestedRole = REGISTRATION_ROLES.find(({ value }) => value === searchParams.get('role'))?.value;

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      organization: '',
      role: requestedRole ?? 'patient',
      password: '',
      confirmPassword: '',
      accept: false,
    },
  });

  const selectedRole = useWatch({ control: form.control, name: 'role' });
  const isProfessional = selectedRole !== 'patient';

  const onSubmit = (values: RegisterValues) =>
    run(async () => {
      const result = await signUpWithPassword({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
        organization: values.organization ?? '',
      });

      // If Supabase returned an active session immediately, navigate right away
      if (result.session && result.user) {
        if (values.role === 'patient') {
          navigate('/app', { replace: true });
        } else {
          navigate(paths.roleSetup, { replace: true });
        }
        return;
      }

      // If email confirmation is disabled in Supabase, sign in immediately with the password
      try {
        await signInWithPassword(values.email, values.password);
        if (values.role === 'patient') {
          navigate('/app', { replace: true });
        } else {
          navigate(paths.roleSetup, { replace: true });
        }
        return;
      } catch {
        // Fallback: send user to login page with clear prompt
        navigate(paths.login, {
          replace: true,
          state: { registered: true, email: values.email, requestedRole: values.role === 'patient' ? undefined : values.role },
        });
      }
    });

  return (
    <AuthShell
      seoTitle="Create account"
      seoDescription="Create your WellNest account."
      title="Create your WellNest account"
      description="Enter your details to create an account immediately. Healthcare staff workspaces require administrator verification."
    >
      {serverError ? (
        <Alert tone="error" title="Account creation failed" className="mb-5">
          {serverError}
        </Alert>
      ) : null}

      <div className="mb-5">
        <GoogleButton
          label="Continue with Google"
        />
      </div>

      <div className="relative mb-5 text-center text-xs text-ink-400">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-white px-3 font-medium uppercase tracking-wider text-ink-400">
          Or continue with email
        </span>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          id="register-name"
          label="Full name"
          autoComplete="name"
          placeholder="Elena Voss"
          error={form.formState.errors.fullName?.message}
          {...form.register('fullName')}
        />
        <Input
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <Select
          id="register-role"
          label="Requested role"
          options={REGISTRATION_ROLES}
          error={form.formState.errors.role?.message}
          {...form.register('role')}
        />
        {isProfessional ? (
          <Alert tone="info" title="Provider verification required">
            Your account will start with patient access. A WellNest administrator must verify your professional role before you can open a staff workspace.
          </Alert>
        ) : null}

        {/* Optional organization field displayed only for professional accounts */}
        {isProfessional ? (
          <Input
            id="register-org"
            label="Requested organization"
            placeholder="e.g. City Hospital, Apex Diagnostics, Care Pharmacy"
            hint="Optional. Your affiliated healthcare facility."
            error={form.formState.errors.organization?.message}
            {...form.register('organization')}
          />
        ) : null}

        <PasswordField
          id="register-password"
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <PasswordField
          id="register-confirm"
          label="Confirm password"
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
        <label className="flex items-start gap-3 text-sm text-ink-600">
          <input
            type="checkbox"
            id="register-accept"
            className="mt-1 h-4 w-4 rounded border-line text-brand-600"
            {...form.register('accept')}
          />
          <span>
            I agree to the Terms of Service and Privacy Policy.
            {form.formState.errors.accept ? (
              <span className="mt-1 block text-rose-600">
                {form.formState.errors.accept.message}
              </span>
            ) : null}
          </span>
        </label>
        <Button
          type="submit"
          id="register-submit"
          size="lg"
          fullWidth
          loading={busy || form.formState.isSubmitting}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-500">
        Already have an account?{' '}
        <Link to={paths.login} className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
