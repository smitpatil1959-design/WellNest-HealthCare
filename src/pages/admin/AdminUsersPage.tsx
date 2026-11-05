import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { EmeraldCard } from '../../components/ui/EmeraldCard';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { AccountStatus, PlatformRole } from '../../types/admin';

export default function AdminUsersPage() {
  const { users, setUserStatus } = useAdminPortal();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<PlatformRole | 'all'>('all');
  const [status, setStatus] = useState<AccountStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return users.filter(
      (u) =>
        `${u.name} ${u.email} ${u.organization}`.toLowerCase().includes(query.toLowerCase()) &&
        (role === 'all' || u.role === role) &&
        (status === 'all' || u.status === status),
    );
  }, [users, query, role, status]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      pending: users.filter((u) => u.status === 'pending').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
    };
  }, [users]);

  const getRoleTone = (r: PlatformRole): BadgeTone => {
    switch (r) {
      case 'doctor':
        return 'sky';
      case 'hospital':
        return 'brand';
      case 'laboratory':
        return 'amber';
      case 'pharmacy':
        return 'emerald';
      case 'insurance':
        return 'brand';
      case 'administrator':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const getStatusTone = (s: AccountStatus): BadgeTone => {
    switch (s) {
      case 'active':
        return 'emerald';
      case 'pending':
        return 'amber';
      case 'suspended':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo title="Platform User Directory" description="Ecosystem accounts, credentialing status, and organization affiliations." />

      <PatientPageHeader
        title="Platform User Directory"
        description="Oversee user accounts, verify role credentialing, and manage organizational memberships across all portals."
        action={
          <Button to={paths.app.adminPermissions} size="sm" variant="outline" leftIcon={<ShieldCheck className="h-4 w-4" />}>
            Role Permissions
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Total User Accounts</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">All registered identities</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Active Verified</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{stats.active}</p>
          <p className="text-[11px] text-emerald-600">Full authenticated access</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Pending Review</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-700">{stats.pending}</p>
          <p className="text-[11px] text-amber-600">Awaiting credential approval</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Suspended</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{stats.suspended}</p>
          <p className="text-[11px] text-rose-600">Access temporarily revoked</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <EmeraldCard className="mb-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, email, or affiliated facility..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as typeof role);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Platform Roles' },
              { value: 'patient', label: 'Patient' },
              { value: 'doctor', label: 'Physician / Doctor' },
              { value: 'hospital', label: 'Hospital Staff' },
              { value: 'laboratory', label: 'Laboratory Technologist / Pathologist' },
              { value: 'pharmacy', label: 'Pharmacist' },
              { value: 'insurance', label: 'Insurance Reviewer' },
              { value: 'administrator', label: 'Platform Administrator' },
            ]}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Account Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending Credentialing' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </EmeraldCard>

      {/* Users Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Users}
              title="No users found"
              description="No platform accounts match your search criteria or role filters."
            >
              {(query || role !== 'all' || status !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setRole('all');
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
                  <th className="py-2.5 px-3">User & Identity</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Platform Role</th>
                  <th className="py-2.5 px-3">Affiliated Facility</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                  <th className="py-2.5 px-3 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        <div>
                          <span className="font-semibold text-ink-900 text-sm block">{u.name}</span>
                          <span className="font-mono text-[10px] text-ink-400">ID: {u.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-ink-700">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getRoleTone(u.role)} className="capitalize text-[10px] font-semibold">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-700">
                      {u.organization || 'Independent'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getStatusTone(u.status)} className="capitalize text-[10px]">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(u.created)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={paths.app.adminUser(u.id)}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-900 px-2 py-1"
                        >
                          Profile
                        </Link>
                        {u.role !== 'administrator' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended')}
                          >
                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </Button>
                        )}
                      </div>
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
              <span className="font-semibold text-ink-800">{rows.length}</span> accounts
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
