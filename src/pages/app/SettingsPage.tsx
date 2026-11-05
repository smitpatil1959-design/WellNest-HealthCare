import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { signOut } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { AUTH_ROLE_LABELS, type NotificationPrefs } from '../../types/auth';
import { safeApiFetch } from '../../utils/apiFetch';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { PhoneVerification } from '../../components/auth/PhoneVerification';
import {AccountExportButton} from './SupportPage';

const defaultPreferences: NotificationPrefs = { email: true, sms: false, product: true };

export default function SettingsPage() {
  const { profile, user, session } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [notificationSaving, setNotificationSaving] = useState(false);
  const preferencesQuery = useAuthenticatedApi<{ success: boolean; preferences: NotificationPrefs | null }>('/api/notifications');
  const notifs = preferencesQuery.data?.preferences ?? defaultPreferences;
  const notificationLoading = preferencesQuery.isLoading;
  const loadError = preferencesQuery.isError ? preferencesQuery.error?.message || 'Notification settings could not be loaded.' : '';

  if (!profile || !user) return null;

  const toggleNotif = async (key: keyof NotificationPrefs) => {
    if (!session?.access_token || !preferencesQuery.data || notificationSaving) return;
    const next = { ...notifs, [key]: !notifs[key] };
    setNotificationSaving(true);
    const result = await safeApiFetch<{ success: boolean }>('/api/notifications', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    setNotificationSaving(false);
    if (!result.ok) {
      setNotificationError(result.error);
      push({ tone: 'error', title: 'Could not save preference', description: result.error });
      return;
    }
    queryClient.setQueryData(['authenticated-api', user?.id, '/api/notifications'], { success: true, preferences: next });
    setNotificationError('');
    push({ tone: 'success', title: 'Saved', description: 'Notification preference updated.' });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setNotice('');
    try {
      await signOut();
      queryClient.clear();
      navigate(paths.login, { replace: true });
    } catch (error) {
      setNotice(error instanceof Error ? `Sign out failed: ${error.message}` : 'Sign out failed. Try again.');
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Seo title="Settings" description="Account and notification preferences." />
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">Workspace Settings</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Manage account credentials, authentication, and notification preferences.</p>
      </div>

      {notice ? <Alert tone="error" title="Could not sign out" className="mb-6">{notice}</Alert> : null}

      <div className="grid gap-5">
        <Card><h2 className="text-base font-semibold text-ink-900">Privacy & account data</h2><p className="mt-2 text-xs leading-6 text-ink-500">Download saved account information or open a tracked privacy request.</p><div className="mt-4 flex flex-wrap items-center gap-3"><AccountExportButton/><Button to={paths.app.support} size="sm" variant="outline">Support & privacy requests</Button></div></Card>
        <Card id="account">
          <h2 className="text-base font-semibold text-ink-900">Account Credentials</h2>
          <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <dt className="text-ink-400 font-medium">Assigned Role</dt>
              <dd className="mt-1 font-semibold text-ink-900 text-sm">{AUTH_ROLE_LABELS[profile.role]}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <dt className="text-ink-400 font-medium">Email Address</dt>
              <dd className="mt-1 font-semibold text-ink-900 text-sm">{profile.email}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button to={paths.app.profile} variant="outline" size="sm">
              Edit profile details
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Security & Authentication</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Keep your credentials up to date. Passwords must meet minimum security requirements.
          </p>
          <div className="mt-4">
            <Button to={paths.twoFactor} variant="outline" size="sm" className="mr-3">Manage authenticator</Button>
            <Button to={paths.resetPassword} variant="outline" size="sm">
              Change password
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Notification Preferences</h2>
          <PhoneVerification />
          {loadError ? (
            <Alert tone="error" title="Notification settings unavailable" className="mt-4">
              {loadError}
              <button type="button" className="ml-2 font-semibold underline" onClick={() => void preferencesQuery.refetch()}>
                Retry
              </button>
            </Alert>
          ) : null}
          {notificationError ? (
            <Alert tone="error" title="Could not save notification preference" className="mt-4">
              {notificationError}
            </Alert>
          ) : null}
          <div className="mt-4 space-y-2.5">
            {([['email', 'Email updates', 'Allow generic account updates and appointment reminders when email delivery is activated.'], ['sms', 'SMS reminders', 'Allow generic reminders to your verified mobile number when SMS delivery is activated.'], ['product', 'Product updates', 'Save your preference for future WellNest product announcements.']] as const).map(([key, label, desc]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 transition-colors hover:bg-slate-50/70 shadow-2xs"
              >
                <div>
                  <p className="text-xs font-semibold text-ink-900">{label}</p>
                  <p className="text-[11px] text-ink-400">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                  checked={notifs[key]}
                  disabled={!preferencesQuery.data || notificationLoading || notificationSaving}
                  onChange={() => void toggleNotif(key)}
                />
              </label>
            ))}
          </div>
          {notificationLoading ? <p className="mt-2.5 text-[11px] text-ink-400">Loading saved preferences…</p> : null}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Session & Sign Out</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Terminate the active session on this workstation and clear cached workspace security tokens.
          </p>
          <div className="mt-4">
            <Button
              id="settings-logout-btn"
              variant="danger"
              size="sm"
              loading={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? 'Signing out…' : 'Log out of workspace'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
