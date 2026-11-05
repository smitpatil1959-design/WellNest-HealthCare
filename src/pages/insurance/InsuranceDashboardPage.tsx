import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileCheck2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Sparkline } from '../../components/ui/Sparkline';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { claimVolume, insuranceNotices } from '../../constants/insuranceData';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

const flow = ['Intake', 'Documentation', 'Clinical Review', 'Adjudication', 'Settlement'];

export default function InsuranceDashboardPage() {
  const { organization, memberCount, role, policies, claims } = useInsurancePortal();

  const roleLabels: Record<string, string> = {
    admin: 'Insurance Administrator',
    reviewer: 'Senior Claims Adjudicator',
    'policy-manager': 'Policy & Benefits Manager',
    support: 'Member Support Representative',
    auditor: 'Compliance & Claims Auditor',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.insurance },
    { label: 'Policies', href: paths.app.insurancePolicies },
    { label: 'Claims', href: paths.app.insuranceClaims },
    { label: 'Review Queue', href: paths.app.insuranceReview },
    { label: 'Members', href: paths.app.insuranceMembers },
    { label: 'Staff Roles', href: paths.app.insuranceStaff },
    { label: 'Insurance Profile', href: paths.app.insuranceProfile },
  ];

  const pendingClaims = claims.filter((c) => c.status === 'new' || c.status === 'review' || c.status === 'documents');
  const approvedClaims = claims.filter((c) => c.status === 'approved' || c.status === 'paid');
  const rejectedClaims = claims.filter((c) => c.status === 'rejected');
  const totalPayout = approvedClaims.reduce((acc, c) => acc + (c.amount || 0), 0);

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'paid':
      case 'approved':
        return 'emerald';
      case 'review':
      case 'documents':
        return 'sky';
      case 'new':
        return 'amber';
      case 'rejected':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo
        title={`${organization?.display_name || 'Insurance'} Workspace`}
        description="Insurance claims adjudication, active member coverage, and benefits management."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="INSURANCE WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Insurance Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.insuranceProfile}
        />

        {/* Operational Adjudication Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <StatCard
            label="Pending Adjudication"
            value={pendingClaims.length}
            icon={Clock}
            tone={pendingClaims.length > 0 ? 'amber' : 'slate'}
            subtext={`${claims.filter((c) => c.status === 'new').length} newly submitted`}
          />
          <StatCard
            label="Approved & Paid"
            value={approvedClaims.length}
            icon={CheckCircle2}
            tone="emerald"
            subtext={`$${totalPayout.toLocaleString()} total adjudicated payout`}
          />
          <StatCard
            label="Claims Denied"
            value={rejectedClaims.length}
            icon={AlertTriangle}
            tone={rejectedClaims.length > 0 ? 'rose' : 'slate'}
            subtext="Non-covered or flagged claims"
          />
          <StatCard
            label="Active Policyholders"
            value={policies.filter((p) => p.status === 'active').length}
            icon={ShieldCheck}
            tone="brand"
            subtext={`${policies.length} total registered plans`}
          />
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to={paths.app.insuranceReview}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Review Queue</p>
                <p className="truncate text-[11px] text-ink-500">{pendingClaims.length} awaiting decision</p>
              </div>
            </Link>
            <Link
              to={paths.app.insurancePolicies}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">New Policy</p>
                <p className="truncate text-[11px] text-ink-500">Add & verify coverage</p>
              </div>
            </Link>
            <Link
              to={paths.app.insuranceFraud}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-rose-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Fraud & Audits</p>
                <p className="truncate text-[11px] text-ink-500">Anomaly detection</p>
              </div>
            </Link>
            <Link
              to={paths.app.insuranceAnalytics}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Loss Ratio</p>
                <p className="truncate text-[11px] text-ink-500">Actuarial metrics</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Adjudication Stepper Banner */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Claims Adjudication Pipeline & Guardrails
              </h2>
              <p className="text-xs text-ink-400">Standard electronic HIPAA 837 transaction cycle</p>
            </div>
            <span className="text-xs text-brand-700 font-medium">Automatic Delta Validation</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {flow.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-2">
                <span className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-ink-700">
                  {s}
                </span>
                {i < flow.length - 1 ? <span className="text-slate-300">→</span> : null}
              </span>
            ))}
          </div>
        </Card>

        {/* Main Section: Recent Claims & Operations */}
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Incoming Claims Intake</h2>
                <p className="text-xs text-ink-500">Submissions from affiliated medical facilities and clinics</p>
              </div>
              <div className="flex items-center gap-3">
                <Sparkline points={claimVolume} className="h-7 w-24 hidden sm:block" />
                <Button to={paths.app.insuranceClaims} size="sm" variant="ghost" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View all
                </Button>
              </div>
            </div>

            {claims.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No claims submitted yet"
                description="Claims routed to this insurance plan will appear here for verification and adjudication."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="py-2.5 px-3">Claim ID</th>
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Service / Indication</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {claims.slice(0, 6).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                            {c.claimId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-ink-900 text-xs sm:text-sm">{c.memberName}</div>
                          <span className="text-[11px] text-ink-400">{c.hospital || 'Outpatient Facility'}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-ink-700">
                          {c.service}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-bold text-ink-900">
                          ${c.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={getStatusTone(c.status)} className="capitalize text-[10px]">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button to={paths.app.insuranceClaim(c.id)} size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="space-y-5 lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-ink-900">Operational Notices</h2>
                <span className="text-[11px] text-ink-400">NAIC / Regulatory Logs</span>
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {insuranceNotices.slice(0, 3).map((n) => (
                  <li key={n.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <Link to={n.href} className="font-semibold text-ink-900 hover:text-brand-700 transition">
                        {n.title}
                      </Link>
                      <p className="text-[11px] text-ink-500">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-ink-400 whitespace-nowrap">{n.time}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <Button to={paths.app.insuranceReview} size="sm" className="text-xs">
                  Review Queue
                </Button>
                <Button to={paths.app.insuranceProfile} size="sm" variant="outline" className="text-xs" leftIcon={<Building2 className="h-3.5 w-3.5" />}>
                  Insurer Profile
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Audit & Policy Desk</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Button to={paths.app.insuranceDocuments} variant="outline" size="sm" className="justify-start">
                  EHR Attachments
                </Button>
                <Button to={paths.app.insuranceMembers} variant="outline" size="sm" className="justify-start">
                  Member Directory
                </Button>
                <Button to={paths.app.insurancePolicies} variant="outline" size="sm" className="justify-start">
                  Benefit Schedules
                </Button>
                <Button to={paths.app.insuranceStaff} variant="outline" size="sm" className="justify-start">
                  Adjuster Roster
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  subtext,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'sky' | 'amber' | 'rose' | 'emerald' | 'slate';
  subtext?: string;
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-500">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2">
        <span className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{value}</span>
        {subtext && <p className="mt-1 text-[11px] text-ink-400">{subtext}</p>}
      </div>
    </div>
  );
}
