import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Pill,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  PlusCircle,
  FileCheck2,
  AlertTriangle,
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
import { pharmacyNotices, rxVolume } from '../../constants/pharmacyData';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

export default function PharmacyDashboardPage() {
  const { organization, memberCount, role, scripts, stock, isOrgAdmin } = usePharmacyPortal();

  const activeScripts = scripts.filter((s) => s.status !== 'completed' && s.status !== 'cancelled');
  const pendingVerify = scripts.filter((s) => s.status === 'pending');
  const inProcessing = scripts.filter((s) => s.status === 'verifying' || s.status === 'processing');
  const readyPickup = scripts.filter((s) => s.status === 'ready');
  const completedToday = scripts.filter((s) => s.status === 'completed');
  const low = stock.filter((i) => i.onHand <= i.reorder);

  const roleLabels: Record<string, string> = {
    'pharmacist-in-charge': 'Pharmacist-in-Charge (Admin)',
    pharmacist: 'Licensed Clinical Pharmacist',
    technician: 'Certified Pharmacy Technician',
    cashier: 'Pharmacy Cashier & Dispense Clerk',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.pharmacy },
    { label: 'Prescription Queue', href: paths.app.pharmacyQueue },
    { label: 'Verify', href: paths.app.pharmacyVerify },
    { label: 'Inventory', href: paths.app.pharmacyInventory },
    { label: 'Orders', href: paths.app.pharmacyOrders },
    { label: 'Staff Roles', href: paths.app.pharmacyStaff },
    { label: 'Pharmacy Profile', href: paths.app.pharmacyProfile },
  ];

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'completed':
        return 'emerald';
      case 'ready':
        return 'brand';
      case 'processing':
      case 'verifying':
        return 'sky';
      case 'pending':
        return 'amber';
      case 'cancelled':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo
        title={`${organization?.display_name || 'Pharmacy'} Workspace`}
        description="Pharmacy dispensing operations, verification queue, and medication inventory."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="PHARMACY WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Pharmacy Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.pharmacyProfile}
        />

        {/* Live Operational Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
          <StatCard
            label="Active Rx Queue"
            value={activeScripts.length}
            icon={Pill}
            tone="brand"
            subtext="Prescriptions currently in dispensing workflow"
          />
          <StatCard
            label="Pending Verification"
            value={pendingVerify.length}
            icon={Clock}
            tone={pendingVerify.length > 0 ? 'amber' : 'slate'}
            subtext="Awaiting pharmacist clinical review"
          />
          <StatCard
            label="Ready for Dispense"
            value={readyPickup.length}
            icon={CheckCircle2}
            tone={readyPickup.length > 0 ? 'emerald' : 'slate'}
            subtext="Packaged & staged at pickup counter"
          />
          <StatCard
            label="Inventory Alerts"
            value={low.length}
            icon={ShieldAlert}
            tone={low.length > 0 ? 'rose' : 'emerald'}
            subtext={low.length > 0 ? `${low.length} items below safety reorder level` : 'All formulary stocks nominal'}
          />
        </motion.div>

        {/* Quick Action Buttons Grid */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to={paths.app.pharmacyQueue}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Pill className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Fulfillment Queue</p>
                <p className="truncate text-[11px] text-ink-500">Fill & process orders</p>
              </div>
            </Link>
            <Link
              to={paths.app.pharmacyVerify}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Verification Desk</p>
                <p className="truncate text-[11px] text-ink-500">{pendingVerify.length} pending review</p>
              </div>
            </Link>
            <Link
              to={paths.app.pharmacyInventory}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Drug Formulary</p>
                <p className="truncate text-[11px] text-ink-500">Stock on hand & lots</p>
              </div>
            </Link>
            <Link
              to={paths.app.pharmacyOrders}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900">Dispense Logs</p>
                <p className="truncate text-[11px] text-ink-500">{completedToday.length} dispensed today</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Main Work Area: Active Queue & Inventory Health */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Active Prescriptions Table */}
          <Card className="lg:col-span-3">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Prescription Intake & Dispensing Bench</h2>
                <p className="text-xs text-ink-500">Live electronic prescriptions routed to this pharmacy</p>
              </div>
              <div className="flex items-center gap-3">
                <Sparkline points={rxVolume} className="h-7 w-24 hidden sm:block" />
                <Button to={paths.app.pharmacyQueue} size="sm" variant="ghost" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View all
                </Button>
              </div>
            </div>

            {scripts.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="No pharmacy prescriptions yet"
                description="Prescriptions issued by verified physicians will automatically appear here for dispensing."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="py-2.5 px-3">Rx #</th>
                      <th className="py-2.5 px-3">Medication & Regimen</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Prescriber</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scripts.slice(0, 6).map((rx) => (
                      <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                            {rx.rxNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-ink-900 text-xs sm:text-sm">{rx.medicine}</div>
                          <span className="text-[11px] text-ink-500">{rx.dosage || rx.sig || 'Daily regimen'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-ink-800">{rx.patientName}</div>
                          <span className="font-mono text-[10px] text-ink-400">ID: {rx.patientId.slice(0, 8)}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-ink-600">
                          Dr. {rx.doctor}
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={getStatusTone(rx.status)} className="capitalize text-[10px]">
                            {rx.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button to={paths.app.pharmacyRx(rx.id)} size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Fill
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Secondary Column: Inventory Safety & Low Stock */}
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink-900">Safety & Low Stock Desk</h2>
                    <p className="text-[11px] text-ink-500">Reorder thresholds & stock alerts</p>
                  </div>
                </div>
                <Badge tone={low.length > 0 ? 'rose' : 'emerald'} className="text-[10px]">
                  {low.length} Alerts
                </Badge>
              </div>

              {low.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-xs font-semibold text-ink-800">Inventory Levels Stable</p>
                  <p className="text-[11px] text-ink-500">All registered medications are above reorder minimums.</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-slate-100">
                  {low.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-ink-900">{item.name} {item.strength}</span>
                        <p className="text-[11px] text-ink-400">SKU: {item.sku} · Lot: {item.lot}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-700">{item.onHand} remaining</span>
                        <span className="block text-[10px] text-ink-400">Reorder at {item.reorder}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3">
                <Button to={paths.app.pharmacyInventory} variant="ghost" size="sm" className="w-full text-xs text-brand-700" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                  Open Inventory Formulary
                </Button>
              </div>
            </Card>

            {/* Completed Dispensing Summary Card */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700">Dispensed & Fulfilled</h3>
                </div>
                <Badge tone="emerald" className="text-[10px]">{completedToday.length} today</Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-ink-900">{completedToday.length}</span>
                <span className="text-xs text-ink-500">prescriptions dispensed</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Saved dispensing actions identify the acting account. Review prescription details and complete pharmacist verification before handover.
              </p>
            </Card>
          </div>
        </div>

        {/* Operational Notices & Quick Navigation */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-ink-900">Regulatory & Operational Notices</h2>
              <span className="text-[11px] text-ink-400">NCPDP / FDA Compliance</span>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {pharmacyNotices.slice(0, 3).map((n) => (
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
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Pharmacy Profile & Staff Workspace</h2>
            <p className="mt-3 text-xs text-ink-600">
              {isOrgAdmin
                ? 'You hold administrative privileges to configure State Board licensure, DEA registration, and pharmacy staff roles.'
                : 'Licensure and dispensary profile settings are under Pharmacist-in-Charge oversight.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button to={paths.app.pharmacyStaff} variant="outline" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Staff Roster
              </Button>
              <Button to={paths.app.pharmacyProfile} variant="primary" size="sm" className="justify-between text-xs" rightIcon={<ExternalLink className="h-3 w-3" />}>
                Pharmacy Profile
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
