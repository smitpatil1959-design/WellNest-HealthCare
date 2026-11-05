import { HospitalEntryForm } from '../../components/organization/HospitalEntryForm';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import type { LabRequest } from '../../types/hospital';
import { fadeUp, stagger } from '../../animations/variants';

const steps: LabRequest['status'][] = ['requested', 'received', 'completed', 'reviewed', 'notified'];

export default function HospitalLabsPage() {
  const { labs, patients, doctors, advanceLab } = useHospitalPortal();

  const completedCount = labs.filter((l) => l.status === 'notified').length;
  const inProgressCount = labs.length - completedCount;

  return (
    <>
      <Seo
        title="Inpatient Laboratory Tracking — Hospital Command"
        description="Monitor diagnostic orders, specimen accessioning, and clinical pathologist sign-off."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Diagnostic Liaison"
          title="Hospital Laboratory Tracking Board"
          description="End-to-end specimen traceability: physician order entry → central lab accessioning → bench analysis → pathologist sign-off → patient lifetime chart notification."
        />
      <HospitalEntryForm kind="labs" />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Active Orders"
            value={labs.length}
            icon={FlaskConical}
            subtext="Inpatient & ER orders"
          />
          <StatTile
            label="In Laboratory"
            value={inProgressCount}
            icon={Clock}
            subtext="Specimen processing"
          />
          <StatTile
            label="Notified to Chart"
            value={completedCount}
            icon={CheckCircle2}
            subtext="Signed & completed"
          />
          <StatTile
            label="Turnaround Time"
            value="< 4 Hours"
            icon={ShieldCheck}
            subtext="Stat diagnostic SLA"
          />
        </motion.div>

        {/* Traceability Lifecycle Pipeline Bar */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-50/70 border-slate-200/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
              Hospital Diagnostic Traceability Lifecycle
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-2xs">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <span className="capitalize">{s.replace('-', ' ')}</span>
                  </span>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Lab Orders List */}
        <motion.div variants={fadeUp} className="space-y-3">
          {labs.map((lab) => {
            const p = patients.find((x) => x.id === lab.patientId);
            const d = doctors.find((x) => x.id === lab.doctorId);
            const isDone = lab.status === 'notified';
            return (
              <Card key={lab.id} hover className="transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-brand-200 bg-brand-50 text-brand-700'
                      }`}
                    >
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink-900">{lab.test}</h3>
                        <Badge
                          tone={isDone ? 'emerald' : 'sky'}
                          className="capitalize text-[10px]"
                        >
                          {lab.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-600">
                        Patient: <strong className="text-ink-900">{p?.name || 'Inpatient'}</strong>{' '}
                        {p?.mrn ? `(MRN: ${p.mrn})` : ''} · Prescriber: {d?.name || 'Attending'}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        Specimen accessioned at Northline Central Diagnostic Laboratory
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    {!isDone ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => advanceLab(lab.id)}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Advance Status
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Signed & Released
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
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
  icon: typeof FlaskConical;
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
