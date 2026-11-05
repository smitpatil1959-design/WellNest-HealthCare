import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Building2 } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { formatDate } from '../../utils/format';
import { safeApiFetch } from '../../utils/apiFetch';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';

interface Grant {
  id: number;
  requester_name: string;
  organization: string;
  categories: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function AccessControlPage() {
  const { session } = useAuth();
  const { push } = useToast();
  const query = useAuthenticatedApi<Grant[]>('/api/access-grants');
  const grants = query.data ?? [];
  const [error, setError] = useState('');

  const revoke = async (grant: Grant) => {
    if (!window.confirm(`Revoke access for ${grant.requester_name}? They will lose chart access immediately.`)) return;
    if (!session?.access_token) {
      setError('Your session is not ready. Sign in again before revoking access.');
      return;
    }
    const res = await safeApiFetch<Grant>('/api/access-grants', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: grant.id }),
    });
    if (res.ok) {
      push({ tone: 'success', title: 'Access revoked' });
      await query.refetch();
    } else setError(res.error);
  };

  return (
    <>
      <Seo title="Who can access" description="Active and historical consent permissions." />
      <PatientPageHeader
        eyebrow="Consent & Privacy"
        title="Who can access my records?"
        description="Review saved consent grants and their expiry dates. Revocation blocks subsequent provider requests; it cannot retrieve copies already shared."
      />

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : query.isError || error ? (
        <Alert tone="error" title="Could not load access grants">
          {error || (query.error instanceof Error ? query.error.message : 'Request failed')}
        </Alert>
      ) : grants.length === 0 ? (
        <EmptyState
          title="No consent grants active"
          description="When you authorize a hospital, clinician, or laboratory, their active permission window will appear here."
        />
      ) : (
        <div className="space-y-3">
          {grants.map((g) => (
            <Card key={g.id} className="transition-all">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      g.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {g.status === 'active' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink-900">{g.requester_name}</h2>
                    <p className="flex items-center gap-1.5 text-xs text-ink-500 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-ink-400" />
                      {g.organization}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      Scope: <span className="font-medium text-ink-700">{g.categories}</span> · Since {formatDate(g.created_at)} · Expires {g.expires_at ? formatDate(g.expires_at) : 'No expiration set'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <Badge tone={g.status === 'active' ? 'emerald' : g.status === 'revoked' ? 'rose' : 'slate'}>
                    {g.status}
                  </Badge>
                  {g.status === 'active' ? (
                    <Button size="sm" variant="danger" onClick={() => revoke(g)}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
