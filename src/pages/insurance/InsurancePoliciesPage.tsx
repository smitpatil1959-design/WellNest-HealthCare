import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { formatDate } from '../../utils/format';
import type { PolicyStatus } from '../../types/insurance';

const tone: Record<PolicyStatus, BadgeTone> = {
  active: 'emerald',
  pending: 'amber',
  expired: 'slate',
  suspended: 'rose',
};

export default function InsurancePoliciesPage() {
  const { policies, upsertPolicy, setPolicyStatus, can } = useInsurancePortal();
  const { push } = useToast();
  const [name, setName] = useState('');
  const [healthId, setHealthId] = useState('');
  const [planName,setPlanName]=useState('');const [policyNumber,setPolicyNumber]=useState('');const [coverageLimit,setCoverageLimit]=useState('');const [deductible,setDeductible]=useState('');const [validFrom,setValidFrom]=useState('');const [validTo,setValidTo]=useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PolicyStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return policies.filter((p) => {
      const hay = `${p.policyId} ${p.memberName} ${p.plan} ${p.memberId}`.toLowerCase();
      return hay.includes(query.toLowerCase()) && (status === 'all' || p.status === status);
    });
  }, [policies, query, status]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: policies.length,
      active: policies.filter((p) => p.status === 'active').length,
      pending: policies.filter((p) => p.status === 'pending').length,
      suspended: policies.filter((p) => p.status === 'suspended' || p.status === 'expired').length,
    };
  }, [policies]);

  if (!can('policies') && !can('all')) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Policy Desk Restricted"
        description="Only policy managers and administrative officers hold authorization to view or issue health plan coverage."
      />
    );
  }

  return (
    <>
      <Seo title="Insurance Policies & Plans" description="Health insurance member policies and benefit schedules." />

      <PatientPageHeader
        title="Insurance Policy Management"
        description="Enroll new policyholders, verify patient Health IDs, manage deductible limits, and administer active benefit terms."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Total Enrolled</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">Total member policies</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Active In-Force</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{stats.active}</p>
          <p className="text-[11px] text-emerald-600">Eligible for claim payment</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Pending Verification</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-700">{stats.pending}</p>
          <p className="text-[11px] text-amber-600">Awaiting eligibility check</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Suspended / Expired</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{stats.suspended}</p>
          <p className="text-[11px] text-rose-600">Claims blocked</p>
        </div>
      </div>

      {/* Add Policy Form Card */}
      <Card className="mb-6">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-sm font-semibold text-ink-900">Enroll New Insured Member</h2>
          <p className="text-xs text-ink-500">Issue an active electronic insurance policy bound to the patient's verified Health ID</p>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !healthId.trim()) return;
            try {
              const saved=await upsertPolicy(
                {
                  id: `pol-${crypto.randomUUID().slice(0, 5)}`,
                  policyId: policyNumber,
                  memberName: name,
                  memberId: 'pending',
                  patientId: 'pending',
                  avatar: '/images/portrait-patient.jpg',
                  status: 'pending',
                  plan: planName,
                  effective: validFrom,
                  expires: validTo,
                  deductible,
                  deductibleMet: '$0',
                  copay: '',
                  dependents: [],
                  coverage: [{ service: 'Policy coverage', covered: coverageLimit, remaining: coverageLimit }],
                },
                healthId,
              );
              if(!saved)return;
              setName('');
              setHealthId('');
              push({ tone: 'success', title: 'Policy Drafted', description: 'Policy created. Verify to activate coverage.' });
            } catch (error) {
              push({
                tone: 'error',
                title: 'Policy Could Not Be Saved',
                description: error instanceof Error ? error.message : 'Request failed.',
              });
            }
          }}
        >
          <Input label="Member Full Name" placeholder="e.g. Eleanor Vance" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Patient Health ID" placeholder="e.g. HID-839201" value={healthId} onChange={(e) => setHealthId(e.target.value)} />
          <Input required label="Plan name" value={planName} onChange={event=>setPlanName(event.target.value)}/><Input required label="Policy number" value={policyNumber} onChange={event=>setPolicyNumber(event.target.value)}/>
          <Input required label="Coverage limit (policy currency)" type="number" min={0} step="0.01" value={coverageLimit} onChange={event=>setCoverageLimit(event.target.value)}/><Input required label="Deductible (policy currency)" type="number" min={0} step="0.01" value={deductible} onChange={event=>setDeductible(event.target.value)}/>
          <Input required label="Valid from" type="date" value={validFrom} onChange={event=>setValidFrom(event.target.value)}/><Input required label="Valid through" type="date" min={validFrom} value={validTo} onChange={event=>setValidTo(event.target.value)}/>
          <div className="flex items-end">
            <Button type="submit" className="w-full" leftIcon={<PlusCircle className="h-4 w-4" />}>
              Enroll Policy
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search policy #, member name, plan type..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Policy Statuses' },
              { value: 'active', label: 'Active In-Force' },
              { value: 'pending', label: 'Pending Verification' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
        </div>
      </Card>

      {/* Policies Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={ShieldCheck}
              title="No insurance policies found"
              description="No member policies match your search criteria or active filters."
            >
              {(query || status !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
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
                  <th className="py-2.5 px-3">Policy Number</th>
                  <th className="py-2.5 px-3">Insured Member</th>
                  <th className="py-2.5 px-3">Benefit Plan Tier</th>
                  <th className="py-2.5 px-3">Deductible / Copay</th>
                  <th className="py-2.5 px-3">Term Expiration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {p.policyId}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-sm">{p.memberName}</div>
                      <span className="font-mono text-[10px] text-ink-400">ID: {p.memberId}</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-800 font-medium">
                      {p.plan}
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-600">
                      <div>Deductible: {p.deductible}</div>
                      <span className="text-[11px] text-ink-400">Copay: {p.copay}</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {p.expires ? formatDate(p.expires) : 'Ongoing'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={tone[p.status]} className="capitalize text-[10px]">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={paths.app.insurancePolicy(p.id)}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-900 px-2 py-1"
                        >
                          Coverage
                        </Link>
                        {p.status === 'pending' && (
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setPolicyStatus(p.id, 'active')}>
                            Verify
                          </Button>
                        )}
                        {p.status === 'active' && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPolicyStatus(p.id, 'suspended')}>
                            Suspend
                          </Button>
                        )}
                        {(p.status === 'expired' || p.status === 'suspended') && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPolicyStatus(p.id, 'active')}>
                            Reinstate
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
              <span className="font-semibold text-ink-800">{rows.length}</span> policies
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
