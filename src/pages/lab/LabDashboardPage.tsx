import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FlaskConical,
  PlusCircle,
  Clock,
  CheckCircle2,
  Activity,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Sparkline } from '../../components/ui/Sparkline';
import { EmptyState } from '../../components/ui/EmptyState';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { labNotices, labVolume } from '../../constants/labData';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

export default function LabDashboardPage() {
  const { organization, memberCount, role, orders, reports } = useLabPortal();

  const todayReq = orders.filter((o) => o.status === 'requested');
  const pending = orders.filter((o) => o.status === 'pending' || o.status === 'requested');
  const inProgress = orders.filter((o) => o.status === 'in-progress');
  const completed = orders.filter((o) => o.status === 'published' || o.status === 'resulted');
  const awaiting = reports.filter((r) => r.status === 'awaiting-verify');
  const publishedToday = reports.filter((r) => r.status === 'published');
  const critical = reports.filter((r) => r.critical && r.status !== 'published');

  const roleLabels: Record<string, string> = {
    director: 'Laboratory Director',
    pathologist: 'Clinical Pathologist',
    technologist: 'Medical Technologist',
    receptionist: 'Lab Intake Staff',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.laboratory },
    { label: 'Orders & Tests', href: paths.app.labTests },
    { label: 'Compose Report', href: paths.app.labCompose },
    { label: 'Reports', href: paths.app.labReports },
    { label: 'Verify', href: paths.app.labVerify },
    { label: 'Staff Roles', href: paths.app.labStaff },
    { label: 'Organization Profile', href: paths.app.labProfile },
  ];

  const getPriorityTone = (priority: string): BadgeTone => {
    switch (priority) {
      case 'critical':
        return 'rose';
      case 'stat':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'published':
        return 'emerald';
      case 'resulted':
        return 'brand';
      case 'awaiting-verify':
        return 'brand';
      case 'in-progress':
        return 'sky';
      case 'pending':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const activeOrders = orders
    .filter((o) => o.status === 'requested' || o.status === 'pending' || o.status === 'in-progress')
    .slice(0, 6);

  return (
    <>
      <Seo
        title={`${organization?.display_name || 'Laboratory'} Workspace`}
        description="Laboratory operations, specimen accessioning, and diagnostic report verification."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="LABORATORY WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Laboratory Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.labProfile}
        />

        {/* Live Lab Operations Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <StatCard
            label="Today's Requests"
            value={todayReq.length}
            icon={FlaskConical}
            tone="brand"
            subtext="New specimens pending intake"
          />
          <StatCard
            label="In Bench / Active"
            value={pending.length + inProgress.length}
            icon={Activity}
            tone="sky"
            subtext={`${inProgress.length} running on analyzers`}
          />
          <StatCard
            label="Awaiting Sign-Off"
            value={awaiting.length}
            icon={Clock}
            tone={awaiting.length > 0 ? 'amber' : 'slate'}
            subtext="Pathologist queue"
          />
          <StatCard
            label="Critical Panics"
            value={critical.length}
            icon={AlertTriangle}
            tone={critical.length > 0 ? 'rose' : 'emerald'}
            subtext={critical.length > 0 ? 'Urgent doctor notification' : 'Zero panic values'}
          />
        </motion.div>

        {/* Quick Actions Bar */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to={paths.app.labTests}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Test Worklist</p>
                <p className="truncate text-[11px] text-ink-500">Accession & process</p>
              </div>
            </Link>
            <Link
              to={paths.app.labCompose}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Compose Report</p>
                <p className="truncate text-[11px] text-ink-500">Enter analyte values</p>
              </div>
            </Link>
            <Link
              to={paths.app.labVerify}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Sign-Off Desk</p>
                <p className="truncate text-[11px] text-ink-500">{awaiting.length} awaiting verify</p>
              </div>
            </Link>
            <Link
              to={paths.app.labCritical}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-rose-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Critical Alerts</p>
                <p className="truncate text-[11px] text-ink-500">{critical.length} panic values</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Main Work Area: Active Orders & Critical Alerts */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Orders Worklist */}
          <Card className="lg:col-span-3">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Physician Test Orders & Specimen Intake</h2>
                <p className="text-xs text-ink-500">Live accession queue routed to this diagnostic laboratory</p>
              </div>
              <div className="flex items-center gap-3">
                <Sparkline points={labVolume} className="h-7 w-24 hidden sm:block" />
                <Button to={paths.app.labTests} size="sm" variant="ghost" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View all
                </Button>
              </div>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No laboratory orders yet"
                description="Orders placed by credentialed physicians for this laboratory will automatically appear here."
              >
                <Button to={paths.app.labCompose} size="sm" variant="outline" className="mt-4" leftIcon={<PlusCircle className="h-4 w-4" />}>
                  Compose Diagnostic Report
                </Button>
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="py-2.5 px-3">Accession</th>
                      <th className="py-2.5 px-3">Diagnostic Test</th>
                      <th className="py-2.5 px-3">Patient / Prescriber</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Requested</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                            {o.accession}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-ink-900 text-xs sm:text-sm">{o.test}</div>
                          <span className="text-[11px] text-ink-400 capitalize">{o.kind}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-ink-800">{o.patientName}</div>
                          <div className="text-[11px] text-ink-500">Dr. {o.doctor}</div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={getPriorityTone(o.priority)} className="uppercase text-[10px]">
                            {o.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={getStatusTone(o.status)} className="capitalize text-[10px]">
                            {o.status.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                          {formatDate(o.requested)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button to={paths.app.labTest(o.id)} size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Process
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Secondary Column: Critical Alerts & Rapid Action */}
          <div className="space-y-5 lg:col-span-2">
            {/* Critical Alert Desk */}
            <Card className="border-rose-100 bg-gradient-to-b from-rose-50/40 to-white">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink-900">Critical Panic Values</h2>
                    <p className="text-[11px] text-rose-700">Mandatory clinician notification</p>
                  </div>
                </div>
                <Badge tone={critical.length > 0 ? 'rose' : 'slate'} className="text-[10px]">
                  {critical.length} Pending
                </Badge>
              </div>

              {critical.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-xs font-semibold text-ink-800">No Critical Panic Values</p>
                  <p className="text-[11px] text-ink-500">All current analytes fall within acceptable physiological limits.</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-rose-100">
                  {critical.map((r) => (
                    <div key={r.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={paths.app.labReport(r.id)} className="text-xs font-semibold text-rose-900 hover:underline">
                            {r.title}
                          </Link>
                          <p className="text-[11px] text-ink-500">
                            Patient: <span className="font-medium text-ink-700">{r.patientName}</span> · Dr. {r.doctor}
                          </p>
                          <p className="mt-1 text-[11px] text-rose-700 font-medium line-clamp-1">{r.impression}</p>
                        </div>
                        <Button to={paths.app.labReport(r.id)} size="sm" variant="outline" className="h-6 text-[10px] shrink-0 border-rose-300 text-rose-800 hover:bg-rose-100">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-rose-100 pt-3">
                <Button to={paths.app.labCritical} variant="ghost" size="sm" className="w-full text-xs text-rose-700 hover:bg-rose-100" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                  Open Full Critical Desk
                </Button>
              </div>
            </Card>

            {/* Completed & Published Card */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700">Completed & Released</h3>
                </div>
                <Badge tone="emerald" className="text-[10px]">{publishedToday.length} today</Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-ink-900">{completed.length}</span>
                <span className="text-xs text-ink-500">diagnostic reports finalized</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Verified by CLIA clinical pathologists and synchronized to patient electronic health records.
              </p>
            </Card>
          </div>
        </div>

        {/* Operational Notices & Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-ink-900">Laboratory Quality & Operational Notices</h2>
              <span className="text-[11px] text-ink-400">CLIA / CAP Accreditation Logs</span>
            </div>
            {labNotices.length === 0 ? (
              <p className="mt-3 text-xs text-ink-400">No active operational alerts or notices.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {labNotices.slice(0, 3).map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <Link to={n.href} className="text-xs font-semibold text-ink-900 hover:text-brand-700 transition">
                        {n.title}
                      </Link>
                      <p className="text-[11px] text-ink-500">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-ink-400 whitespace-nowrap">{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Bench Navigation</h2>
            <div className="mt-3 grid gap-2">
              <Button to={paths.app.labCompose} variant="outline" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Compose Diagnostic Report
              </Button>
              <Button to={paths.app.labPublish} variant="outline" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Publish & Release Queue
              </Button>
              <Button to={paths.app.labStaff} variant="outline" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Clinical Pathologist & Staff Roster
              </Button>
              <Button to={paths.app.labProfile} variant="outline" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Accreditation & CLIA Profile
              </Button>
            </div>
          </Card>
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
