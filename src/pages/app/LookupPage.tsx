import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ShieldCheck,
  Lock,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileText,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { roleCategories } from '../../lib/healthId';
import { fadeUp, stagger } from '../../animations/variants';

interface Found {
  healthId: string;
  displayName: string;
  city: string;
}

export default function LookupPage() {
  const [searchParams] = useSearchParams();
  const requestedHealthId = searchParams.get('id')?.trim() ?? '';

  return <LookupPageContent key={requestedHealthId} requestedHealthId={requestedHealthId} />;
}

function LookupPageContent({ requestedHealthId }: { requestedHealthId: string }) {
  const { role, session } = useAuth();
  const { push } = useToast();
  const [healthId, setHealthId] = useState(() => requestedHealthId.toUpperCase());
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('Clinical care & diagnostic evaluation');
  const categories = roleCategories(role);

  const lookup = async () => {
    setBusy(true);
    setError('');
    setFound(null);
    setRequestStatus(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/health-lookup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ healthId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFound(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const request = async () => {
    if (!found || !session?.access_token) return;
    setBusy(true);
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          healthId: found.healthId,
          purpose,
          durationHours: 72,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!['pending', 'approved', 'denied'].includes(data.status)) {
        throw new Error(
          'The request was submitted, but the server did not return its saved status. Check request history before retrying.'
        );
      }
      setRequestStatus(data.status);
      push({
        tone: 'success',
        title: 'Consent request dispatched',
        description: `Saved request status: ${data.status}. The patient can review it in Access requests.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request access');
    } finally {
      setBusy(false);
    }
  };

  const quickPurposes = [
    'Clinical outpatient consultation',
    'Pre-admission history verification',
    'Prescription safety & interaction review',
    'Follow-up diagnostic assessment',
  ];

  return (
    <>
      <Seo
        title="Universal Health ID Lookup — Clinical Care Desk"
        description="Verify patient identity and establish time-bounded 72-hour clinical consent."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Access Desk"
          title="Universal Health ID Lookup"
          description="Look up a patient identifier and request 72-hour access to the categories permitted for your role. Clinical records require an active consent grant."
        />

        {/* Security & Protocol Tiles */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Chart access"
            value="Consent required"
            icon={Lock}
            subtext="Lookup does not open the chart"
          />
          <StatTile
            label="Consent Window"
            value="72 Hours"
            icon={Clock}
            subtext="Auto-expiring window"
          />
          <StatTile
            label="Role Scope"
            value={role ? role.toUpperCase() : 'VERIFIED'}
            icon={ShieldCheck}
            subtext="RBAC restricted categories"
          />
          <StatTile
            label="Audit Trail"
            value="Logged"
            icon={KeyRound}
            subtext="Lookup and consent events"
          />
        </motion.div>

        {/* Main 2-Column Workstation */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Lookup Form */}
          <motion.div variants={fadeUp} className="lg:col-span-7 space-y-4">
            <Card>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Patient Identity Query</h2>
                <p className="text-xs text-ink-500">
                  Enter the patient's universal Health ID card code
                </p>
              </div>

              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  lookup();
                }}
              >
                <div>
                  <Input
                    label="Patient Health ID"
                    value={healthId}
                    onChange={(e) => setHealthId(e.target.value.toUpperCase())}
                    placeholder="e.g. VY-8492-91PM"
                    maxLength={14}
                    leftIcon={<Search className="h-4 w-4 text-ink-400" />}
                  />
                  <p className="mt-1 text-[11px] text-ink-400">
                    Format: VY-XXXX-XXXX. Located on the patient's digital or physical health card.
                  </p>
                </div>

                <Button type="submit" loading={busy} fullWidth leftIcon={<Search className="h-4 w-4" />}>
                  Query Identity Registry
                </Button>
              </form>

              {error ? (
                <Alert tone="error" title="Lookup query failed" className="mt-4">
                  {error}
                </Alert>
              ) : null}

              {requestStatus ? (
                <Alert
                  tone={requestStatus === 'approved' ? 'success' : requestStatus === 'denied' ? 'error' : 'info'}
                  title={`Consent Request Status: ${requestStatus.toUpperCase()}`}
                  className="mt-4"
                >
                  {requestStatus === 'approved'
                    ? 'The patient has authorized this request. You may now inspect permitted clinical records in your patient panel.'
                    : requestStatus === 'denied'
                    ? 'The patient has declined this request. Records remain locked.'
                    : 'The request is saved for the patient to review in Access requests. Chart access remains closed until approval.'}
                </Alert>
              ) : null}

              {/* Verified Identity Card */}
              {found ? (
                <div className="mt-6 rounded-2xl border border-teal-200/80 bg-teal-50/40 p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={found.displayName} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-ink-900">{found.displayName}</h3>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="font-mono text-xs font-semibold text-brand-700">
                          {found.healthId}
                          {found.city ? ` · ${found.city}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge tone="emerald">Verified Patient</Badge>
                  </div>

                  <div className="mt-4 rounded-xl border border-teal-100 bg-white p-3 text-xs text-ink-600 space-y-1">
                    <p className="font-semibold text-brand-900">Privacy & Scope Boundary:</p>
                    <p className="text-[11px] text-ink-500">
                      Authorized clinical categories for your profile: <strong className="text-brand-800">{categories}</strong>. Duration: <strong>72 hours</strong> from time of authorization.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Textarea
                      label="Clinical Purpose for Chart Request"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {quickPurposes.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPurpose(p)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-ink-600 hover:border-brand-300 hover:text-brand-700"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="mt-5"
                    fullWidth
                    onClick={request}
                    loading={busy}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Dispatch 72-Hour Consent Request
                  </Button>
                </div>
              ) : null}
            </Card>
          </motion.div>

          {/* Right Column: Protocols & Safety Guidance */}
          <motion.div variants={fadeUp} className="lg:col-span-5 space-y-4">
            <Card>
              <h3 className="text-sm font-bold text-ink-900">Consent Verification Standards</h3>
              <p className="mt-1 text-xs text-ink-500">
                Patient lookup and record access are separate steps:
              </p>

              <div className="mt-4 space-y-3 text-xs text-ink-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                    1
                  </span>
                  <span>
                    <strong>Identity lookup:</strong> Returns limited matching profile details. Confirm the Health ID with the patient.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                    2
                  </span>
                  <span>
                    <strong>Patient review:</strong> The saved request appears in the patient's Access requests page. It does not grant access by itself.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                    3
                  </span>
                  <span>
                    <strong>Grant expiry:</strong> This form requests 72 hours of access. Provider requests check the grant's expiry and revocation status.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200/70">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-ink-900">Recorded access activity</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    Lookup and consent actions record the acting account and result. Use patient information only for an authorized purpose.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-xl font-bold tracking-tight text-ink-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
