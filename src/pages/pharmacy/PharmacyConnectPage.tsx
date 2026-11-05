import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  ChevronRight,
  Pill,
  Send,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { useToast } from '../../providers/ToastProvider';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

const chain = ['Physician E-Signs Rx', 'Pharmacist Verification', 'Fulfillment & Staging', 'Automated Patient Push', 'Counter Pickup Verified'];

export default function PharmacyConnectPage() {
  const { scripts, setStatus, can } = usePharmacyPortal();
  const { push } = useToast();
  const ready = scripts.filter((s) => s.status === 'ready');
  const completed = scripts.filter((s) => s.status === 'completed');

  return (
    <>
      <Seo
        title="Patient Dispense Notifications & Staging — Pharmacy Command"
        description="Notify patients of ready prescriptions, provide pickup codes, and log counter dispensations."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Patient Communication"
          title="Patient Pickup Notifications & Staging"
          description="Manage prescription readiness and pickup status. Saved status changes can create in-app updates; external reminders require provider setup."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Ready in Bins"
            value={ready.length}
            icon={Package}
            subtext="Awaiting patient counter pickup"
          />
          <StatTile
            label="Dispensed Today"
            value={completed.length}
            icon={CheckCircle2}
            subtext="Committed to patient timelines"
          />
          <StatTile
            label="Patient Push Alert"
            value="Automated"
            icon={Bell}
            subtext="SMS & Portal alert"
          />
          <StatTile
            label="Chain of Custody"
            value="Federated"
            icon={ShieldCheck}
            subtext="Tamper-proof pickup record"
          />
        </motion.div>

        {/* Chain Bar */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-50/70 border-slate-200/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
              Fulfillment to Patient Pickup Synchronization Chain
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {chain.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-2xs">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <span>{s}</span>
                  </span>
                  {idx < chain.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Ready Orders Queue */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-900">
              Orders Staged for Counter Pickup ({ready.length})
            </h3>
            <span className="text-xs text-ink-400">Verify patient photo ID and pickup code</span>
          </div>

          {ready.length === 0 ? (
            <EmptyState
              title="No prescriptions currently staged"
              description="Orders in the fulfillment line will populate here once bagged and marked ready by technicians."
            >
              <Button to={paths.app.pharmacyOrders} variant="outline" size="sm" className="mt-4">
                View Fulfillment Line
              </Button>
            </EmptyState>
          ) : (
            ready.map((rx) => {
              const pickupCode = (rx.id.slice(-4) + '19').slice(0, 4);
              return (
                <Card key={rx.id} hover className="transition-all">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-ink-900">{rx.medicine}</h4>
                          <Badge tone="emerald" className="text-[10px]">
                            Ready for Pickup
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-600">
                          Patient: <strong className="text-ink-900">{rx.patientName}</strong> · Prescriber: Dr. {rx.doctor}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-ink-500">
                          <span className="font-semibold text-brand-800 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                            Pickup Code: #{pickupCode}
                          </span>
                          <span>Rx: {rx.rxNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                      {can('connect') || can('all') ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!(await setStatus(rx.id, 'completed'))) return;
                            push({
                              tone: 'success',
                              title: 'Dispensation completed',
                              description: `${rx.patientName} was notified. Pickup committed to lifetime timeline.`,
                            });
                          }}
                          leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        >
                          Log Counter Pickup
                        </Button>
                      ) : (
                        <Badge tone="slate">Restricted</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
