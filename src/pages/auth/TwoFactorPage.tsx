import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Factor } from '@supabase/supabase-js';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';
import supabase from '../../lib/supabase';
import { paths } from '../../routes/paths';
import { dashboardPathFor, isRouteAllowedForRole, signOut,fetchDbProfile,resolveUserRole } from '../../services/auth/authService';

type Enrollment = { id: string; qr: string; secret: string };
export default function TwoFactorPage() {
  const { user, role, loading, mfaRequired, mfaError, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRemove, setConfirmRemove] = useState('');
  const [checked, setChecked] = useState(false);
  const load = useCallback(async () => {
    const result = await supabase.auth.mfa.listFactors();
    if (result.error) { setError(result.error.message); return; }
    setFactors(result.data.all); setChecked(true);
  }, []);
  useEffect(() => { if (user) void load(); }, [user?.id, load]);
  if (!loading && !user) return <Navigate to={paths.login} replace state={{ from: paths.twoFactor }} />;
  const verified = factors.filter(factor => factor.factor_type === 'totp' && factor.status === 'verified');
  const pending = factors.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified');
  const run = async (action: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); setNotice(''); try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Security action could not be completed.'); } finally { setBusy(false); } };
  const verify = () => run(async () => {
    const factorId = enrollment?.id || verified[0]?.id;
    if (!factorId || !/^\d{6}$/.test(code)) throw new Error('Enter the six-digit code from your authenticator.');
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (result.error) throw result.error;
    setEnrollment(null); setCode(''); await load(); await refreshProfile();
    const current=await supabase.auth.getUser();
    const nextRole=current.data.user?resolveUserRole(current.data.user,await fetchDbProfile(current.data.user.id)):role;
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && nextRole && isRouteAllowedForRole(from, nextRole) ? from : mfaRequired && nextRole ? dashboardPathFor(nextRole) : paths.app.settings, { replace: true });
  });
  return <AuthShell seoTitle="Two-factor authentication" seoDescription="Protect your WellNest account with an authenticator." title={mfaRequired ? 'One more step to your workspace.' : 'A little more protection.'} description="Use an authenticator app to generate a six-digit security code. Keep access to your authenticator when changing phones.">
    {(error || mfaError) && <Alert tone="error" title="Security check needs attention" className="mb-4">{error || mfaError}</Alert>}
    {notice && <Alert tone="success" title="Account security" className="mb-4">{notice}</Alert>}
    {mfaError && <Button variant="outline" onClick={() => void refreshProfile()}>Retry security check</Button>}
    {!checked && <p role="status" className="text-sm text-ink-500">Checking authenticator setup…</p>}
    {checked && !verified.length && !enrollment && <>
      <p className="mb-4 text-sm leading-6 text-ink-600">An authenticator is not enabled yet. Start setup, scan the QR code, then verify a code to activate it.</p>
      <Button loading={busy} onClick={() => void run(async () => {
        const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `WellNest ${new Date().toISOString().slice(0, 19)}` });
        if (result.error) throw result.error;
        setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret });
      })}>Set up authenticator</Button>
      {pending.map(factor => <div key={factor.id} className="mt-3 rounded-xl bg-brand-50 p-3 text-xs"><p>Unfinished setup: {factor.friendly_name || 'Authenticator'}</p><button className="mt-2 font-semibold underline" disabled={busy} onClick={() => void run(async () => { const result = await supabase.auth.mfa.unenroll({ factorId: factor.id }); if (result.error) throw result.error; await load(); })}>Discard unfinished setup</button></div>)}
    </>}
    {enrollment && <div className="mb-5 rounded-2xl border border-line bg-white p-4"><img src={enrollment.qr} alt="Scan this code in your authenticator app" className="mx-auto size-48"/><p className="mt-3 text-xs text-ink-500">Manual setup key</p><code className="mt-2 block break-all text-xs select-all">{enrollment.secret}</code><p className="mt-3 text-xs text-ink-500">This key is shown only during setup. Do not share it.</p></div>}
    {(enrollment || verified.length > 0 && mfaRequired) && <form className="mt-5 space-y-4" onSubmit={event => { event.preventDefault(); void verify(); }}><Input required label="Authenticator code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))}/><Button type="submit" fullWidth loading={busy}>Verify code</Button></form>}
    {verified.length > 0 && !mfaRequired && <div className="space-y-3"><Alert tone="success" title="Authenticator enabled">Your enrolled account will require a code when signing in.</Alert>{verified.map(factor => <div key={factor.id} className="rounded-xl border border-line p-3 text-sm"><p>{factor.friendly_name || 'Authenticator'}</p>{confirmRemove === factor.id ? <Button className="mt-3" size="sm" variant="danger" loading={busy} onClick={() => void run(async () => { const result = await supabase.auth.mfa.unenroll({ factorId: factor.id }); if (result.error) throw result.error; setConfirmRemove(''); await load(); await refreshProfile(); setNotice('Authenticator removed.'); })}>Confirm remove authenticator</Button> : <button className="mt-2 text-xs font-semibold underline" onClick={() => setConfirmRemove(factor.id)}>Remove authenticator</button>}</div>)}</div>}
    <div className="mt-6 flex flex-wrap gap-4 text-sm">{!mfaRequired && <Link to={paths.app.settings} className="font-semibold text-brand-700">Return to settings</Link>}<button className="font-semibold text-ink-500" onClick={() => void run(async () => { await signOut(); navigate(paths.login, { replace: true }); })}>Sign out</button></div>
    <p className="mt-5 text-xs leading-6 text-ink-500">If you lose your authenticator, contact support for identity-verified recovery. Email access alone does not bypass two-factor authentication.</p>
    <Link to={paths.support} className="mt-2 inline-block text-xs font-semibold text-brand-700">Request authenticator recovery</Link>
  </AuthShell>;
}
