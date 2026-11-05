import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { paths } from '../../routes/paths';
import { loginSchema, type LoginValues } from '../../services/auth/schemas';
import { dashboardPathFor, fetchDbProfile, getPendingProfessionalRole, isRouteAllowedForRole, resolveUserRole, signInWithPassword } from '../../services/auth/authService';
import { readRememberedEmail, writeRememberedEmail } from '../../services/auth/profileStore';
import { useAuthForm } from '../../hooks/useAuthForm';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import type { UserRole } from '../../types/roles';
import { ArrowRight, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, pendingProfessionalRole, loading } = useAuth();
  const { push } = useToast();
  const { serverError, setServerError, busy, run } = useAuthForm();
  const routeState = location.state as { from?: string; registered?: boolean; requestedRole?: UserRole; email?: string } | null;
  const from = routeState?.from;

  // Show success banner when redirected here after a successful registration
  const justRegistered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: routeState?.email || readRememberedEmail(),
      password: '',
      remember: Boolean(readRememberedEmail()),
    },
  });

  // If a session already exists, jump straight to the user's authorized dashboard
  useEffect(() => {
    if (user && !loading) {
      if (pendingProfessionalRole) {
        navigate(paths.roleSetup, { replace: true });
      } else if (role) {
        const destination = from && isRouteAllowedForRole(from, role)
          ? from
          : dashboardPathFor(role);
        navigate(destination, { replace: true });
      } else {
        navigate(paths.roleSetup, { replace: true });
      }
    }
  }, [user, role, pendingProfessionalRole, loading, from, navigate]);

  const onSubmit = (values: LoginValues) =>
    run(async () => {
      const result = await signInWithPassword(values.email, values.password);
      writeRememberedEmail(values.remember ? values.email : null);

      const dbProfile = await fetchDbProfile(result.user.id);
      const nextRole = resolveUserRole(result.user, dbProfile);
      const pendingRole = nextRole === 'patient' ? getPendingProfessionalRole(result.user) : null;
      push({ tone: 'success', title: 'Signed in', description: 'Opening your workspace.' });

      if (pendingRole) {
        navigate(paths.roleSetup, { replace: true });
        return;
      }

      if (!nextRole) {
        navigate(paths.roleSetup, { replace: true });
        return;
      }

      // Check whether 'from' is valid and permitted for the authenticated user's real role
      const destination = from && isRouteAllowedForRole(from, nextRole)
        ? from
        : dashboardPathFor(nextRole);

      navigate(destination, { replace: true });
    });

  return (
    <AuthShell
      seoTitle="Login"
      seoDescription="Sign in to your WellNest workspace."
      title="A healthier connection starts here."
      description="Welcome to WellNest. Sign in and we’ll take you to your personal workspace. New here? There’s a place for you, too."
    >
      {/* Success banner shown when redirected here after registration */}
      {justRegistered ? (
        <Alert tone="success" title="Account created successfully" className="mb-5">
          Please sign in to continue.
        </Alert>
      ) : null}

      {serverError ? (
        <Alert tone="error" title="Could not sign in" className="mb-5">
          {serverError}
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <div className="auth-form-links flex flex-wrap items-center justify-between gap-3 py-1">
          <label className="inline-flex items-center gap-2 text-ink-600">
            <input
              type="checkbox"
              id="login-remember"
              className="h-4 w-4 rounded border-line text-brand-600"
              {...form.register('remember')}
            />
            Remember my email
          </label>
          <Link to={paths.forgotPassword} className="font-semibold text-brand-700">
            Forgot password
          </Link>
        </div>
        <Button
          type="submit"
          id="login-submit"
          size="lg"
          fullWidth
          loading={busy || form.formState.isSubmitting}
          rightIcon={<ArrowRight size={16} />}
        >
          Sign in to your workspace
        </Button>
      </form>

      <div className="relative my-5 text-center text-xs text-ink-400">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-[#faf9f5] px-3 text-[10px] text-ink-400">
          or keep it simple
        </span>
      </div>

      <GoogleButton
        label="Continue with Google"
        returnTo={from}
        onError={setServerError}
      />

      <p className="mt-6 text-center text-xs text-ink-500">
        New to WellNest?{' '}
        <Link to={paths.register} className="font-semibold text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
