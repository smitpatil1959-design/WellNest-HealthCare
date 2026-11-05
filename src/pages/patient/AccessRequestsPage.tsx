import { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';

interface RequestRow {
  id: number;
  requester_name: string;
  organization: string;
  purpose: string;
  categories: string;
  duration_hours: number;
  status: string;
}

export default function AccessRequestsPage() {
  const { session } = useAuth();
  const { push } = useToast();
  const query = useAuthenticatedApi<RequestRow[]>('/api/access-requests');
  const rows = query.data ?? [];
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pendingRows = rows.filter((r) => r.status === 'pending');
  const decidedRows = rows.filter((r) => r.status !== 'pending');

  const decide = async (id: number, status: 'approved' | 'denied') => {
    setActionError('');
    if (!session?.access_token) {
      setActionError('Your session is not ready. Sign in again before responding.');
      return;
    }
    setProcessingId(id);
    const res = await safeApiFetch<RequestRow>('/api/access-requests', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setProcessingId(null);
    if (res.ok) {
      push({
        tone: status === 'approved' ? 'success' : 'info',
        title: status === 'approved' ? 'Access Permission Granted' : 'Access Request Denied',
        description: status === 'approved'
          ? 'The verified provider has been granted temporary, read-only chart access.'
          : 'The provider has been denied access to your clinical record.',
      });
      await query.refetch();
    } else {
      setActionError(res.error);
    }
  };

  return (
    <>
      <Seo title="Access Requests" description="Review, approve, or deny provider chart access requests." />
      <PatientPageHeader
        eyebrow="Patient consent"
        title="Access requests"
        description="Review who is requesting your records, which categories they need and how long access will last. A Health ID alone does not grant access."
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-800">Pending Requests</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{pendingRows.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Decided Inquiries</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{decidedRows.length}</p>
        </div>
      </div>

      {actionError ? (
        <Alert tone="error" title="Could not update request" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : query.isError ? (
        <Alert tone="error" title="Could not load requests">
          {query.error instanceof Error ? query.error.message : 'Request failed'}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending access requests"
          description="When a physician, hospital, or laboratory looks up your universal Health ID, their authorization request will appear here for your review."
        />
      ) : (
        <div className="space-y-6">
          {/* Pending Section */}
          {pendingRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700">
                  Action Required ({pendingRows.length})
                </h2>
              </div>

              {pendingRows.map((row) => (
                <Card
                  key={row.id}
                  className="border-amber-200/80 bg-gradient-to-r from-amber-50/20 via-white to-white shadow-xs transition-all hover:border-amber-300"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                            Consent Inquiry
                          </span>
                          <span className="text-xs font-semibold text-ink-500 flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-ink-400" />
                            {row.organization}
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-ink-900">
                          {row.requester_name}
                        </h3>
                        <p className="mt-1 text-xs text-ink-600">
                          <strong className="text-ink-800">Clinical Purpose:</strong> {row.purpose}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-ink-700 border border-slate-200">
                            Scope: <strong className="text-ink-900">{row.categories}</strong>
                          </span>
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-ink-700 border border-slate-200">
                            Window: <strong className="text-ink-900">{row.duration_hours} hours</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <Button
                        size="sm"
                        variant="primary"
                        loading={processingId === row.id}
                        onClick={() => decide(row.id, 'approved')}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Allow Access
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={processingId === row.id}
                        onClick={() => decide(row.id, 'denied')}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Decided / Historical Requests Section */}
          {decidedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">
                Resolved Inquiries ({decidedRows.length})
              </h2>

              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      <tr>
                        <th className="px-4 py-3">Requester & Facility</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3">Requested Categories</th>
                        <th className="px-4 py-3">Duration Window</th>
                        <th className="px-4 py-3 text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-ink-800">
                      {decidedRows.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-3.5 align-middle">
                            <p className="font-semibold text-ink-900">{row.requester_name}</p>
                            <p className="text-[11px] text-ink-400 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {row.organization}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs truncate">
                            {row.purpose}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs font-medium text-ink-700">
                            {row.categories}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs text-ink-500 whitespace-nowrap">
                            {row.duration_hours} hours
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                            <Badge
                              tone={row.status === 'approved' ? 'emerald' : row.status === 'denied' ? 'rose' : 'slate'}
                              className="capitalize"
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Security Protocol Footer Box */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-xs text-teal-900">
            <div className="flex items-center gap-2 font-semibold text-brand-800 mb-1">
              <Lock className="h-4 w-4" />
              <span>Time-limited access</span>
            </div>
            <p className="leading-relaxed text-ink-600">
              Approving a request creates a saved access grant for its listed categories and duration. The server checks expiry and revocation before provider requests.
              You may also revoke active access at any time from the <strong className="text-ink-800">Who can access</strong> tab.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
