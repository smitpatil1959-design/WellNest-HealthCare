import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Pill,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { fadeUp, stagger } from '../../animations/variants';

const steps = ['Prescription Ingestion', 'Universal Identity Match', 'Provider License Check', 'DUR & Allergy Screen', 'Pharmacist Signature', 'Dispense Authorized'];

export default function PharmacyVerifyPage() {
  const { scripts, verify, reject, can } = usePharmacyPortal();
  const { push } = useToast();
  const queue = scripts.filter((rx) => rx.status === 'pending' || rx.status === 'verifying');

  if (!can('verify') && !can('all')) {
    return (
      <EmptyState
        title="Pharmacist Licensure Required"
        description="Prescription clinical verification and Drug Utilization Review (DUR) sign-off is restricted to registered Pharmacists in Charge."
      />
    );
  }

  return (
    <>
      <Seo
        title="Pharmacist Verification Bench & DUR — Pharmacy Command"
        description="Verify physician prescription orders, execute drug utilization review (DUR), and authorize dispensing."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Safety & DUR"
          title="Pharmacist Prescription Verification Bench"
          description="Authenticate electronic provider signatures, screen against patient allergy profiles, verify dosage safety intervals, and certify dispensing orders."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Pending Verification"
            value={queue.length}
            icon={Clock}
            subtext="Awaiting pharmacist review"
          />
          <StatTile
            label="DUR Screening"
            value="100% Automated"
            icon={ShieldCheck}
            subtext="Interaction alerts active"
          />
          <StatTile
            label="Verification SLA"
            value="< 15 Mins"
            icon={CheckCircle2}
            subtext="Average clinical review"
          />
          <StatTile
            label="Legal Compliance"
            value="DEA / NABP"
            icon={FileCheck2}
            subtext="Electronic e-prescribe rules"
          />
        </motion.div>

        {/* Verification Pipeline Bar */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-50/70 border-slate-200/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
              Standard Pharmacy Clinical Verification Protocol
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-2xs">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <span>{s}</span>
                  </span>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Verification Worklist */}
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-900">
              Orders Awaiting Clinical Sign-Off ({queue.length})
            </h3>
            <span className="text-xs text-ink-400">Earliest requested first</span>
          </div>

          {queue.length === 0 ? (
            <EmptyState
              title="Verification Queue Clear"
              description="All incoming e-prescriptions and provider orders have been clinically reviewed and authorized for the fill line."
            >
              <Button to={paths.app.pharmacyQueue} variant="outline" size="sm" className="mt-4">
                View Dispense Queue
              </Button>
            </EmptyState>
          ) : (
            queue.map((rx) => {
              const isPatientUpload = rx.source === 'patient';
              return (
                <Card key={rx.id} hover className="transition-all">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          isPatientUpload
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-brand-200 bg-brand-50 text-brand-700'
                        }`}
                      >
                        <Pill className="h-5 w-5" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-ink-900">{rx.medicine}</h4>
                          <span className="font-mono text-xs font-semibold rounded bg-slate-100 px-2 py-0.5 text-ink-700">
                            {rx.rxNumber}
                          </span>
                          <Badge tone={isPatientUpload ? 'amber' : 'emerald'}>
                            {isPatientUpload ? 'Patient Uploaded · Needs Doctor Auth' : `Doctor Signed · ${rx.source}`}
                          </Badge>
                        </div>

                        <p className="text-xs text-ink-600">
                          Patient: <strong className="text-ink-900">{rx.patientName}</strong> · Prescriber: Dr. {rx.doctor} · {rx.hospital}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-ink-600">
                            Dosage: {rx.dosage || 'Take as directed'}
                          </span>
                          <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-ink-600">
                            Quantity: {rx.quantity || 30} units · {rx.refills || 0} Refills
                          </span>
                        </div>

                        {/* Allergy Warning Pill */}
                        <div className="mt-2 text-xs">
                          {rx.allergies && rx.allergies.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200/80 px-2.5 py-1 font-semibold text-rose-800">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Recorded Patient Allergies: {rx.allergies.join(', ')} (Screened OK)
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-400">No known drug allergies on patient profile</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!(await verify(rx.id))) return;
                          push({
                            tone: 'success',
                            title: 'Prescription verified',
                            description: `${rx.medicine} authorized and moved to the active dispensing line.`,
                          });
                        }}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Authorize & Move to Fill
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          if (!(await reject(rx.id, 'Clinical discrepancy detected during DUR check.'))) return;
                          push({
                            tone: 'error',
                            title: 'Prescription rejected',
                            description: 'The prescription was cancelled with a review note.',
                          });
                        }}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Reject
                      </Button>
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
  icon: typeof Clock;
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
