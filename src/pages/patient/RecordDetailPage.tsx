import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  UserCheck,
  Calendar,
  FileText,
  Clock,
  Printer,
  Copy,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/format';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { safeApiFetch } from '../../utils/apiFetch';
import { downloadMedicalRecordPdf } from '../../utils/medicalRecordPdf';

interface RecordRow {
  id: string;
  title: string;
  category: string;
  source: string;
  status: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  laboratory: string | null;
  summary: string | null;
}

interface AccessGrant {
  id: number;
  requester_name: string;
  organization: string;
  status: string;
  expires_at: string | null;
  categories: string;
}

export default function RecordDetailPage() {
  const { recordId = '' } = useParams();
  const { session } = useAuth();
  const { push } = useToast();
  const [selectedGrant, setSelectedGrant] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareError, setShareError] = useState('');
  const [sharing, setSharing] = useState(false);

  const recordQuery = useAuthenticatedApi<RecordRow | null>(`/api/records?id=${encodeURIComponent(recordId)}`);
  const grantsQuery = useAuthenticatedApi<AccessGrant[]>('/api/access-grants');
  const record = recordQuery.data;
  const grants = (grantsQuery.data ?? []).filter((grant) => grant.status === 'active');
  const recipientGrant = selectedGrant || String(grants[0]?.id ?? '');
  const sourceLabel = record?.source === 'verified' ? 'Provider-issued' : record?.source === 'uploaded' ? 'Patient-uploaded' : 'Source not recorded';

  const createShare = async () => {
    if (!record || !session?.access_token || !recipientGrant) return;
    setShareError('');
    setSharing(true);
    const result = await safeApiFetch<{ success: boolean; shareId: string; expiresAt: string }>('/api/record-share', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: record.id, grantId: Number(recipientGrant) }),
    });
    setSharing(false);
    if (!result.ok) {
      setShareError(result.error);
      return;
    }
    const url = new URL(`/app/shared-reports/${encodeURIComponent(result.data.shareId)}`, window.location.origin).toString();
    setShareLink(url);
    try {
      await navigator.clipboard.writeText(url);
      push({
        tone: 'success',
        title: 'Secure link created & copied',
        description: `Link expires ${formatDate(result.data.expiresAt)}. Recipient must sign in to view.`,
      });
    } catch {
      push({
        tone: 'info',
        title: 'Secure link generated',
        description: 'Copy the share link generated below for your authorized provider.',
      });
    }
  };

  return (
    <>
      <AuthenticatedApiState loading={recordQuery.isLoading} error={recordQuery.error} retry={() => { void recordQuery.refetch(); }}>
        {!record ? (
          <EmptyState
            title="Record not found"
            description="This medical record is either unavailable or you do not have permission to view it."
            actionLabel="Back to records"
            onAction={() => window.history.back()}
          />
        ) : (
          <>
            <Seo title={record.title} description={record.summary ?? 'Structured clinical medical record'} />

            {/* Top Navigation & Actions Bar */}
            <div className="mb-6">
              <Link
                to={paths.app.patientRecords}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to all records
              </Link>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-200">
                      {record.category}
                    </span>
                    {record.source === 'verified' ? (
                      <VerifiedBadge label="Provider-issued record" />
                    ) : (
                      <Badge tone="slate">{sourceLabel}</Badge>
                    )}
                    <Badge tone={record.status === 'released' || record.status === 'verified' ? 'emerald' : 'amber'} className="capitalize">
                      {record.status}
                    </Badge>
                  </div>
                  <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                    {record.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => downloadMedicalRecordPdf(record)}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Two-Panel Layout */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Panel: Record Overview & Clinical Details (8 cols) */}
              <div className="space-y-6 lg:col-span-8">
                {/* Provider & Metadata Card */}
                <Card>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-4">
                    Clinical Document Header
                  </h2>
                  <div className="grid gap-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-brand-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400 font-medium">Healthcare Organization</p>
                        <p className="text-sm font-semibold text-ink-900">{record.hospital || 'Not recorded'}</p>
                        {record.laboratory ? <p className="text-xs text-ink-500">{record.laboratory}</p> : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400 font-medium">Attending Physician / Provider</p>
                        <p className="text-sm font-semibold text-ink-900">{record.doctor || 'Not recorded'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400 font-medium">Record Date</p>
                        <p className="text-sm font-semibold text-ink-900">{formatDate(record.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400 font-medium">Record Reference ID</p>
                        <p className="font-mono text-xs font-semibold text-ink-800 truncate max-w-[200px]">
                          {record.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Structured Clinical Content Card */}
                <Card>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-700" />
                      <h2 className="text-sm font-semibold text-ink-900">Structured Clinical Summary</h2>
                    </div>
                    <span className="text-xs text-ink-400 font-medium">Confidential Medical Record</span>
                  </div>

                  <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed space-y-4">
                    {record.summary ? (
                      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs">
                        <p className="whitespace-pre-line text-sm">{record.summary}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-ink-500">
                        No additional narrative notes provided for this entry.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Panel: Actions, Sharing & Verification (4 cols) */}
              <div className="space-y-6 lg:col-span-4">
                {/* Verification Card */}
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-semibold text-ink-900">Provenance & Trust</h2>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-ink-500">Attribution</span>
                      <span className="font-semibold text-ink-800">{sourceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-ink-500">Release Status</span>
                      <span className="font-semibold text-ink-800 capitalize">{record.status}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-ink-500">Source Type</span>
                      <span className="font-semibold text-ink-800">{sourceLabel}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-ink-400 pt-1">
                      Source attribution and saved status describe this application record. They do not establish a cryptographic signature or independent clinical certification.
                    </p>
                  </div>
                </Card>

                {/* Secure Provider Share Card */}
                <Card className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-brand-700" />
                    <h2 className="text-sm font-semibold text-ink-900">Authorize Provider Access</h2>
                  </div>

                  <p className="text-xs text-ink-500 leading-relaxed">
                    Create a time-limited link for the selected provider. The recipient must sign in and still hold an active consent grant.
                  </p>

                  {grantsQuery.isError ? (
                    <Alert tone="error" title="Failed to load grants">
                      {grantsQuery.error instanceof Error ? grantsQuery.error.message : 'Error loading consents'}
                    </Alert>
                  ) : grantsQuery.isLoading ? (
                    <p className="text-xs text-ink-400">Loading active provider grants…</p>
                  ) : grants.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                      <p className="font-semibold">No active provider grants</p>
                      <p className="mt-1">
                        To share this document, first approve an access request from your doctor in the Access Control tab.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-1" htmlFor="share-grant">
                          Recipient Organization
                        </label>
                        <select
                          id="share-grant"
                          value={selectedGrant || String(grants[0]?.id ?? '')}
                          onChange={(e) => setSelectedGrant(e.target.value)}
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink-800 shadow-2xs focus:border-brand-500 focus:outline-none"
                        >
                          {grants.map((grant) => (
                            <option key={grant.id} value={grant.id}>
                              {grant.requester_name} ({grant.organization || 'Verified Clinic'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {shareError ? (
                        <Alert tone="error" title="Share failed">
                          {shareError}
                        </Alert>
                      ) : null}

                      <Button
                        size="sm"
                        className="w-full justify-center"
                        leftIcon={<Share2 className="h-3.5 w-3.5" />}
                        loading={sharing}
                        onClick={createShare}
                      >
                        Create Secure Recipient Link
                      </Button>

                      {shareLink ? (
                        <div className="space-y-1.5 pt-2">
                          <label className="text-[11px] font-semibold text-ink-600">Generated Secure Link</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              readOnly
                              value={shareLink}
                              onFocus={(e) => e.target.select()}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-ink-700 font-mono"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void navigator.clipboard.writeText(shareLink);
                                push({ tone: 'success', title: 'Link copied!' });
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-ink-400">Expires in 24 hours. Authentication required.</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </AuthenticatedApiState>
    </>
  );
}
