import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Pill,
  Stethoscope,
  Bed,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { DischargeDraft } from '../../types/hospital';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { useToast } from '../../providers/ToastProvider';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalDischargePage() {
  const { discharges, patients, admits, saveDischarge, organization, staffRole } = useHospitalPortal();
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const draft = discharges.find(row => row.id === selectedId) || discharges.find(row => !row.approved) || discharges[0];
  const [edited, setLocal] = useState<DischargeDraft>();
  const local = edited || draft;
  const patient = patients.find((p) => p.id === local?.patientId);
  const adm = admits.find((a) => a.id === local?.admissionId);

  if (!local || !patient) {
    return (
      <Card className="text-center py-12">
        <FileCheck2 className="mx-auto h-12 w-12 text-ink-300" />
        <h3 className="mt-4 text-base font-bold text-ink-900">No Inpatient Discharges in Progress</h3>
        <p className="mt-1 text-xs text-ink-500">
          Discharge worklists will populate when patients are scheduled for transition of care.
        </p>
      </Card>
    );
  }

  const set = (patch: Partial<typeof local>) => setLocal({ ...local, ...patch });

  return (
    <>
      <Seo
        title="Inpatient Discharge Summary & Reconciliation — Hospital Command"
        description="Formal physician discharge summary, medication reconciliation, and care transition sign-off."
      />
      <Select label="Discharge worklist" value={draft.id} onChange={event => { setSelectedId(event.target.value); setLocal(undefined); }} options={discharges.map(row => ({ value: row.id, label: `${patients.find(patient => patient.id === row.patientId)?.name || 'Patient'} · ${row.approved ? 'Released' : 'Draft'}` }))} />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Care Transition"
          title="Inpatient Discharge & Care Summary"
          description="Finalize physician clinical course, reconcile discharge pharmacotherapy, and authorize bed release into the lifetime health record."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Print Summary
            </Button>
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Inpatient Stay"
            value={`${adm?.room || '304'}-${adm?.bed || 'B'}`}
            icon={Bed}
            subtext="Ward assignment"
          />
          <StatTile
            label="Discharge Status"
            value={local.approved ? 'Signed' : 'Awaiting MD'}
            icon={local.approved ? CheckCircle2 : Clock}
            subtext={local.approved ? 'Stay closed' : 'Pending signature'}
          />
          <StatTile
            label="Admit → Discharge"
            value={`${adm?.admitted || '2026-10-28'} → ${adm?.expected || 'Today'}`}
            icon={Calendar}
            subtext="Inpatient duration"
          />
          <StatTile
            label="EMR Release"
            value="Federated"
            icon={ShieldCheck}
            subtext="Lifetime timeline update"
          />
        </motion.div>

        {/* 2-Column Discharge Console */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Form */}
          <motion.div variants={fadeUp} className="lg:col-span-7">
            <Card>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Physician Discharge Orders</h2>
                <p className="text-xs text-ink-500">
                  Patient: <strong className="text-ink-900">{patient.name}</strong> · MRN: {patient.mrn}
                </p>
              </div>

              <form
                className="mt-4 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!(await saveDischarge(local))) return;
                  push({ tone: 'info', title: 'Discharge draft saved' });
                }}
              >
                <Input
                  label="Final Primary Diagnosis *"
                  value={local.diagnosis}
                  onChange={(e) => set({ diagnosis: e.target.value })}
                  placeholder="e.g. Acute exacerbation of COPD, improved"
                />

                <Textarea
                  label="Hospital Clinical Course & Interventions"
                  value={local.treatment}
                  onChange={(e) => set({ treatment: e.target.value })}
                  placeholder="Summary of inpatient stay, daily progress, and resolution of acute findings..."
                />

                <Input
                  label="Bedside Procedures Performed"
                  value={local.procedures}
                  onChange={(e) => set({ procedures: e.target.value })}
                  placeholder="e.g. Diagnostic thoracentesis, bedside spirometry"
                />

                <Textarea
                  label="Reconciled Discharge Medications *"
                  value={local.medication}
                  onChange={(e) => set({ medication: e.target.value })}
                  placeholder="e.g. Fluticasone/Salmeterol 250/50mcg BID; Albuterol HFA PRN"
                />

                <Input
                  label="Post-Discharge Follow-Up Clinic"
                  value={local.followUp}
                  onChange={(e) => set({ followUp: e.target.value })}
                  placeholder="e.g. Pulmonary Clinic in 10 days with Dr. Chen"
                />

                <Textarea
                  label="Patient & Caregiver Home Instructions"
                  value={local.instructions}
                  onChange={(e) => set({ instructions: e.target.value })}
                  placeholder="Warning signs for emergency return, dietary guidelines, and activity restrictions..."
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <Button type="submit" variant="outline" size="sm">
                    Save Progress Draft
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={local.approved || staffRole !== 'doctor'}
                    onClick={async () => {
                      const next = { ...local, approved: true };
                      if (!(await saveDischarge(next))) return;
                      setLocal(next);
                      push({
                        tone: 'success',
                        title: 'Discharge approved & closed',
                        description: 'Admission closed. Linked patients with active consent receive the summary in Medical Records.',
                      });
                    }}
                    leftIcon={<FileCheck2 className="h-4 w-4" />}
                  >
                    Release discharge summary
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Right Column: Formal Discharge Certificate Preview */}
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <Card className="border-slate-300/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-700" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-800">
                      {organization?.display_name || 'Hospital'}
                    </span>
                  </div>
                  <Badge tone={local.approved ? 'emerald' : 'amber'}>
                    {local.approved ? 'Released' : 'Draft'}
                  </Badge>
                </div>
                <h3 className="mt-2 font-display text-xl font-bold text-ink-900">
                  Clinical Discharge Summary
                </h3>
                <p className="text-[11px] text-ink-400">Hospital care summary</p>
              </div>

              <div className="mt-4 space-y-3 text-xs text-ink-600">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-1">
                  <p>
                    <span className="text-ink-400">Patient: </span>
                    <strong className="text-ink-900">{patient.name}</strong> · MRN: {patient.mrn}
                  </p>
                  <p>
                    <span className="text-ink-400">Location: </span>
                    Room {adm?.room}, Bed {adm?.bed} ({adm?.admitted} → {adm?.expected})
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div>
                    <span className="font-semibold text-ink-800">Primary Diagnosis: </span>
                    <span className="text-brand-900 font-medium">{local.diagnosis}</span>
                  </div>
                  {local.treatment && (
                    <div>
                      <span className="font-semibold text-ink-800">Clinical Course: </span>
                      <p className="mt-0.5 text-ink-600 leading-relaxed text-[11px]">{local.treatment}</p>
                    </div>
                  )}
                  {local.medication && (
                    <div className="rounded-lg bg-teal-50/60 border border-teal-100 p-2.5">
                      <span className="font-bold text-teal-900 flex items-center gap-1">
                        <Pill className="h-3 w-3" /> Reconciled Rx:
                      </span>
                      <p className="mt-0.5 text-teal-800 text-[11px]">{local.medication}</p>
                    </div>
                  )}
                  {local.followUp && (
                    <div>
                      <span className="font-semibold text-ink-800">Follow-Up Schedule: </span>
                      <span className="text-amber-800 font-medium">{local.followUp}</span>
                    </div>
                  )}
                  {local.instructions && (
                    <div>
                      <span className="font-semibold text-ink-800">Care Instructions: </span>
                      <p className="mt-0.5 text-ink-500 text-[11px] leading-relaxed">{local.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-dashed border-slate-200 pt-3 text-center">
                <p className="text-[10px] text-ink-400">
                  Signed and released by credentialed attending staff. Document ID: VYR-DIS-{local.id}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
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
  value: string;
  subtext: string;
  icon: typeof Bed;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-xl font-bold tracking-tight text-ink-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
