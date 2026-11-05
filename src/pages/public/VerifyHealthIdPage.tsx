import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, ShieldCheck, Stethoscope, User, ArrowRight, Copy } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui/Button';
import { paths } from '../../routes/paths';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { formatHealthId } from '../../lib/healthId';

export default function VerifyHealthIdPage() {
  const { healthId } = useParams<{ healthId: string }>();
  const { user, role, session } = useAuth();
  const { push } = useToast();
  const [patientData, setPatientData] = useState<{ displayName: string; verified: boolean; city?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState('');

  const cleanId = formatHealthId(healthId || '');
  const isValidFormat = /^VY-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(cleanId) || /^[A-Z0-9-]{4,16}$/i.test(cleanId);

  useEffect(() => {
    let mounted = true;
    async function verify() {
      if (!cleanId || !isValidFormat) {
        setLoading(false);
        return;
      }
      if (!user || !session?.access_token || !['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance', 'administrator'].includes(role || '')) {
        setVerificationError('Sign in with a verified healthcare provider account to verify this Health ID.');
        setLoading(false);
        return;
      }

      try {
        // Query verification endpoint
        const res = await fetch(`/api/health-lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            healthId: cleanId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.displayName) {
            setPatientData({
              displayName: data.displayName,
              verified: true,
              city: data.city,
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // The generic verification error below intentionally hides server details.
      }

      if (mounted) {
        setVerificationError('This Health ID could not be verified. Please check the ID or try again later.');
        setLoading(false);
      }
    }

    verify();
    return () => {
      mounted = false;
    };
  }, [cleanId, isValidFormat, user, role, session?.access_token]);

  const copyId = async () => {
    if (!cleanId) return;
    await navigator.clipboard.writeText(cleanId);
    push({ tone: 'success', title: 'Health ID Copied', description: cleanId });
  };

  const isClinician = ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance', 'administrator'].includes(role || '');

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8">
      <Seo
        title={`Verify Health ID ${cleanId}`}
        description="Verified WellNest Universal Health ID identity verification."
      />

      <div className="mx-auto max-w-lg">
        {/* Brand Header */}
        <div className="flex justify-center mb-8">
          <Link to={paths.home} className="inline-block transition hover:opacity-90">
            <Logo />
          </Link>
        </div>

        {/* Verification Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-lg">
          {!isValidFormat ? (
            <div className="text-center py-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="mt-4 font-display text-xl font-bold text-ink-900">
                Invalid Health ID Format
              </h1>
              <p className="mt-2 text-xs text-ink-500">
                The identifier supplied does not match a valid WellNest Universal Health ID structure.
              </p>
              <div className="mt-5">
                <Button to={paths.home} variant="outline" size="sm">
                  Return to Home
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
              <p className="mt-3 text-xs font-medium text-ink-600">Verifying Health ID…</p>
            </div>
          ) : !patientData ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="mt-4 font-display text-xl font-bold text-ink-900">Health ID Not Verified</h1>
              <p className="mt-2 text-xs text-ink-500">{verificationError || 'Sign in with a verified provider account to verify this Health ID.'}</p>
              <div className="mt-5">
                <Button to={paths.login} variant="outline" size="sm">Healthcare Staff Login</Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Top verification pill */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Verified Health Identity
                    </p>
                    <p className="text-[10px] text-ink-400">Authenticated via WellNest</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-slate-100"
                  title="Copy Health ID"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>

              {/* Patient Badge */}
              <div className="mt-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <User className="h-7 w-7" />
                </div>
                <h1 className="mt-3 font-display text-2xl font-bold text-ink-900">
                  {patientData?.displayName || 'Verified Patient'}
                </h1>
                <div className="mt-2 inline-flex items-center rounded-xl bg-brand-50/80 px-3.5 py-1 ring-1 ring-brand-100">
                  <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-brand-900">
                    {cleanId}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-ink-400">
                  Universal Patient Health Identifier · Active
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 text-left">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-brand-700 mt-0.5" />
                  <div className="text-xs leading-relaxed text-ink-700">
                    <p className="font-semibold text-brand-950">Consent Controls Clinical Access</p>
                    <p className="mt-0.5 text-ink-600">
                      Sensitive medical records, diagnostic test results, and prescriptions are strictly protected
                      by consent. Medical staff and healthcare providers must sign in to request or view authorized charts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical Actions */}
              <div className="mt-6 space-y-2.5">
                {isClinician ? (
                  <Button
                    to={`/app/lookup?id=${encodeURIComponent(cleanId)}`}
                    fullWidth
                    size="lg"
                    leftIcon={<Stethoscope className="h-4 w-4" />}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Open in Clinical Workspace
                  </Button>
                ) : user ? (
                  <Button
                    to={paths.app.patient}
                    fullWidth
                    size="lg"
                    variant="outline"
                  >
                    Open Workspace
                  </Button>
                ) : (
                  <Button
                    to={`/login?from=${encodeURIComponent(`/app/lookup?id=${cleanId}`)}`}
                    fullWidth
                    size="lg"
                    leftIcon={<Stethoscope className="h-4 w-4" />}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Healthcare Staff Login
                  </Button>
                )}

                <p className="text-center text-xs text-ink-400 pt-1">
                  Are you this patient?{' '}
                  <Link to={paths.login} className="font-semibold text-brand-700 hover:underline">
                    Sign in to manage your access consents
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
