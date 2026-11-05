import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  Lock,
  Activity,
  FileText,
  Filter,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useHealthIdentity } from '../../hooks/useHealthIdentity';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface AuditRow {
  id: number;
  actor_name: string;
  actor_role: string;
  organization: string;
  action: string;
  result: string;
  created_at: string;
}

const labels: Record<string, { label: string; icon: typeof ShieldCheck; tone: 'brand' | 'emerald' | 'rose' | 'amber' }> = {
  health_id_lookup: { label: 'Health ID Identity Lookup', icon: Search, tone: 'brand' },
  access_requested: { label: 'Record Access Requested', icon: FileText, tone: 'amber' },
  consent_approved: { label: 'Patient Granted Consent', icon: CheckCircle2, tone: 'emerald' },
  consent_denied: { label: 'Patient Denied Consent', icon: XCircle, tone: 'rose' },
  access_revoked: { label: 'Consent Explicitly Revoked', icon: RotateCcw, tone: 'rose' },
};

export default function AccessHistoryPage() {
  const identity = useHealthIdentity();
  const endpoint = identity.identity?.health_id
    ? `/api/health-audit?healthId=${encodeURIComponent(identity.identity.health_id)}`
    : '';
  const query = useAuthenticatedApi<AuditRow[]>(endpoint, Boolean(identity.identity?.health_id));
  const rows = query.data ?? [];
  const error = identity.error || (query.error instanceof Error ? query.error.message : '');

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredRows = useMemo(() => {
    if (activeFilter === 'all') return rows;
    return rows.filter((r) => r.action === activeFilter);
  }, [rows, activeFilter]);

  const lookupsCount = rows.filter((r) => r.action === 'health_id_lookup').length;
  const approvedCount = rows.filter((r) => r.action === 'consent_approved').length;
  const deniedCount = rows.filter((r) => r.action === 'consent_denied' || r.action === 'access_revoked').length;

  return (
    <>
      <Seo title="Access History" description="Cryptographic audit log of Health ID lookups and consent decisions." />
      <PatientPageHeader
        eyebrow="Immutable Audit"
        title="Consent & access history"
        description="Review recorded Health ID lookups, consent decisions and record access events with their saved timestamps."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Audit Events</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Identity Lookups</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{lookupsCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Granted Authorizations</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-800">Blocked / Revoked</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-rose-900">{deniedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Audit Events' },
          { id: 'health_id_lookup', label: 'Identity Lookups' },
          { id: 'consent_approved', label: 'Granted Consents' },
          { id: 'consent_denied', label: 'Denied Requests' },
          { id: 'access_revoked', label: 'Revocations' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
              activeFilter === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {identity.loading || query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert tone="error" title="Could not load history">
          {error}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No access history recorded"
          description="When licensed providers look up your Health ID or you approve consent requests, entries will appear here."
        />
      ) : (
        <div className="space-y-4">
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5">
            {filteredRows.map((row) => {
              const meta = labels[row.action] || {
                label: row.action.replaceAll('_', ' '),
                icon: Activity,
                tone: 'brand' as const,
              };
              const IconComponent = meta.icon;

              return (
                <div key={row.id} className="relative group">
                  {/* Timeline Node */}
                  <div
                    className={cn(
                      'absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white',
                      meta.tone === 'emerald'
                        ? 'border-emerald-500 text-emerald-600'
                        : meta.tone === 'rose'
                          ? 'border-rose-500 text-rose-600'
                          : meta.tone === 'amber'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-brand-600 text-brand-600'
                    )}
                  >
                    <IconComponent className="h-3 w-3" />
                  </div>

                  {/* Audit Entry Card */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-brand-200 hover:shadow-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                            {meta.label}
                          </h3>
                          <Badge tone={meta.tone} className="text-[10px] capitalize">
                            {row.result || 'Logged'}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
                          <strong className="text-ink-800">{row.actor_name}</strong>
                          <span>·</span>
                          <span className="capitalize font-medium text-brand-700">{row.actor_role}</span>
                          {row.organization ? (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-ink-500">
                                <Building2 className="h-3 w-3 text-ink-400" />
                                {row.organization}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <span className="text-xs font-mono text-ink-400">
                        {formatDate(row.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit information */}
          <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-xs text-teal-900">
            <div className="flex items-center gap-2 font-semibold text-brand-800 mb-1">
              <Lock className="h-4 w-4" />
              <span>Recorded access history</span>
            </div>
            <p className="leading-relaxed text-ink-600">
              These are saved application audit events. Providers cannot edit them through this portal. Database operators manage retention and recovery; this view does not certify cryptographic immutability.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
