import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Search,
  Filter,
  Radio,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { formatDate } from '../../utils/format';

export default function AdminActivityPage() {
  const { audit } = useAdminPortal();
  const activityFeed = audit.map(row => ({ ...row, target: row.record }));
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'denied'>('all');

  const filtered = useMemo(() => {
    return activityFeed.filter((e) => {
      const matchRole = role === 'all' || e.role === role;
      const matchStatus = statusFilter === 'all' || e.result === statusFilter;
      const matchText = `${e.actor} ${e.action} ${e.organization} ${e.target}`.toLowerCase().includes(query.toLowerCase());
      return matchRole && matchStatus && matchText;
    });
  }, [role, statusFilter, query, audit]);

  const totalOk = activityFeed.filter((e) => e.result === 'ok').length;
  const totalDenied = activityFeed.filter((e) => e.result === 'denied').length;

  return (
    <>
      <Seo title="Platform Activity Stream" description="Live-style cross-portal event and transaction telemetry." />
      <PatientPageHeader
        eyebrow="Observability & Telemetry"
        title="Cross-portal platform activity"
        description="Unified live event stream capturing patient registrations, clinical note signatures, laboratory report releases, prescription fills, and insurance claims."
      />

      {/* Primary KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-700">Live Event Feed</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{activityFeed.length}</p>
          <p className="text-[11px] text-brand-700 font-medium">Logged in current buffer</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Authorized Operations</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-700">{totalOk}</p>
          <p className="text-[11px] text-ink-400">Policy verified</p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-800">Security Blocks / Denied</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-rose-900">{totalDenied}</p>
          <p className="text-[11px] text-rose-700 font-medium">Enforced at API gateway</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Connected Portals</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">7 Active</p>
          <p className="text-[11px] text-ink-400">Full telemetry sync</p>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action, org, target..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />

          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'all', label: 'All Portals / Roles' },
              { value: 'doctor', label: 'Doctor Workspaces' },
              { value: 'laboratory', label: 'Laboratory Workspaces' },
              { value: 'pharmacy', label: 'Pharmacy Workspaces' },
              { value: 'insurance', label: 'Insurance Workspaces' },
              { value: 'administrator', label: 'Platform Operations' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            options={[
              { value: 'all', label: 'All Outcome States' },
              { value: 'ok', label: 'Successful Operations Only' },
              { value: 'denied', label: 'Denied / Blocked Only' },
            ]}
          />
        </div>
      </Card>

      {/* Activity Timeline Feed */}
      <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-4">
        {filtered.map((e) => {
          const isOk = e.result === 'ok';

          return (
            <div key={e.id} className="relative group">
              {/* Status node */}
              <div
                className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white ${
                  isOk ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600'
                }`}
              >
                {isOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              </div>

              {/* Event Card */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-brand-200 hover:shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                        {e.action}
                      </h3>
                      <Badge tone={isOk ? 'emerald' : 'rose'} className="text-[10px] capitalize">
                        {e.result}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {e.target}
                      </span>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
                      <User className="h-3.5 w-3.5 text-ink-400" />
                      <strong className="text-ink-800">{e.actor}</strong>
                      <span>·</span>
                      <span className="capitalize font-medium text-brand-700">{e.role}</span>
                      {e.organization && e.organization !== '—' ? (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-ink-500">
                            <Building2 className="h-3 w-3 text-ink-400" />
                            {e.organization}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-ink-400">
                    {e.at.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
