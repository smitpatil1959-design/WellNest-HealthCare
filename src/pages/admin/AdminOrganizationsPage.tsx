import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { OrgKind, OrgStatus } from '../../types/admin';

const tone: Record<OrgStatus, BadgeTone> = {
  verified: 'emerald',
  pending: 'amber',
  'under-review': 'sky',
  rejected: 'rose',
  suspended: 'rose',
};

export default function AdminOrganizationsPage() {
  const { orgs } = useAdminPortal();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<OrgKind | 'all'>('all');
  const [status, setStatus] = useState<OrgStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return orgs.filter((o) => {
      const hay = `${o.name} ${o.registration} ${o.kind}`.toLowerCase();
      return (
        hay.includes(query.toLowerCase()) &&
        (kind === 'all' || o.kind === kind) &&
        (status === 'all' || o.status === status)
      );
    });
  }, [orgs, query, kind, status]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: orgs.length,
      verified: orgs.filter((o) => o.status === 'verified').length,
      pending: orgs.filter((o) => o.status === 'pending' || o.status === 'under-review').length,
      suspended: orgs.filter((o) => o.status === 'suspended' || o.status === 'rejected').length,
    };
  }, [orgs]);

  return (
    <>
      <Seo title="Platform Organizations & Issuers" description="Hospitals, diagnostic laboratories, pharmacies, and health insurance payers." />

      <PatientPageHeader
        title="Organizations & Healthcare Issuers"
        description="Verify institutional credentials, monitor CLIA/NCPDP/NAIC compliance, and audit organizational staff rosters."
        action={
          <Button to={paths.app.adminVerification} size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
            Register / Verify Organization
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Registered Facilities</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">Total institutional issuers</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Verified Network</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{stats.verified}</p>
          <p className="text-[11px] text-emerald-600">Verified organization accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Pending Review</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-700">{stats.pending}</p>
          <p className="text-[11px] text-amber-600">Awaiting packet inspection</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Revoked / Suspended</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{stats.suspended}</p>
          <p className="text-[11px] text-rose-600">Signing privileges blocked</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search facility name, registration #..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Facility Types' },
              { value: 'hospital', label: 'Hospital Facility' },
              { value: 'laboratory', label: 'Diagnostic Laboratory' },
              { value: 'pharmacy', label: 'Dispensing Pharmacy' },
              { value: 'insurance', label: 'Health Insurance Plan' },
              { value: 'clinic', label: 'Outpatient Clinic' },
            ]}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Accreditation Statuses' },
              { value: 'verified', label: 'Verified & Certified' },
              { value: 'pending', label: 'Pending Verification' },
              { value: 'under-review', label: 'Under Review' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </Card>

      {/* Organizations Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Building2}
              title="No healthcare organizations found"
              description="No registered institutions match your search query or active filters."
            >
              {(query || kind !== 'all' || status !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setKind('all');
                    setStatus('all');
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="py-2.5 px-3">Organization Name</th>
                  <th className="py-2.5 px-3">Facility Type</th>
                  <th className="py-2.5 px-3">Licensure / Registration</th>
                  <th className="py-2.5 px-3">Accreditation Status</th>
                  <th className="py-2.5 px-3">Affiliated Staff</th>
                  <th className="py-2.5 px-3">Registered Since</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-sm">{o.name}</div>
                      <span className="font-mono text-[10px] text-ink-400">ID: {o.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-xs font-medium text-ink-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {o.kind}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-ink-700">
                      {o.registration || 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={tone[o.status]} className="capitalize text-[10px]">
                        {o.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-600 font-medium">
                      {o.users} staff members
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(o.created)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        to={paths.app.adminOrganization(o.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-brand-700 hover:text-brand-900 hover:bg-brand-50"
                        rightIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-ink-500">
              Showing <span className="font-semibold text-ink-800">{page * size + 1}</span> to{' '}
              <span className="font-semibold text-ink-800">{Math.min((page + 1) * size, rows.length)}</span> of{' '}
              <span className="font-semibold text-ink-800">{rows.length}</span> facilities
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 text-ink-600 font-medium">
                {page + 1} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page + 1 >= pages}
                onClick={() => setPage((n) => n + 1)}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
