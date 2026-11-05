import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Stethoscope,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  PlusCircle,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { useToast } from '../../providers/ToastProvider';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalRecordsPage() {
  const { consults, patients, doctors, addConsult } = useHospitalPortal();
  const { push } = useToast();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [rx, setRx] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Seo
        title="Consultations & Progress Notes — Hospital Command"
        description="Signed physician progress notes, clinical impressions, and encounter prescriptions."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Documentation"
          title="Physician Consults & Encounter Notes"
          description="Record attending progress notes, diagnostic impressions, and inpatient medication orders directly to the patient's lifetime health chronology."
          action={
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              {showForm ? 'Close Form' : 'Document Consult Note'}
            </Button>
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Encounter Notes"
            value={consults.length}
            icon={FileText}
            subtext="Signed consultations"
          />
          <StatTile
            label="Attending Staff"
            value={new Set(consults.map((c) => c.doctorId)).size}
            icon={Stethoscope}
            subtext="Documenting physicians"
          />
          <StatTile
            label="Prescriptions Issued"
            value={consults.filter((c) => c.rx).length}
            icon={Pill}
            subtext="Inpatient & discharge Rx"
          />
          <StatTile
            label="Follow-Up Scheduled"
            value={consults.filter((c) => c.followUp).length}
            icon={Calendar}
            subtext="Care transitions"
          />
        </motion.div>

        {/* Note Entry Drawer/Card */}
        {showForm ? (
          <motion.div variants={fadeUp}>
            <Card className="border-brand-200/80 bg-brand-50/20">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Document Inpatient Consultation Note</h2>
                <p className="text-xs text-ink-500">
                  Saved clinical documentation can be linked to a consenting patient's chart
                </p>
              </div>

              <form
                className="mt-4 grid gap-3.5 md:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!diagnosis.trim()) return;
                  const saved = await addConsult({
                    patientId,
                    doctorId,
                    date: new Date().toISOString().slice(0, 10),
                    diagnosis,
                    notes,
                    rx,
                    labs: [],
                    followUp,
                  });
                  if (!saved) return;
                  setDiagnosis('');
                  setNotes('');
                  setRx('');
                  setFollowUp('');
                  setShowForm(false);
                  push({
                    tone: 'success',
                    title: 'Physician note signed',
                    description: 'Progress note committed to master patient chart.',
                  });
                }}
              >
                <Select
                  label="Patient Chart"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  options={[{ value: '', label: 'Choose patient chart' }, ...patients.map((p) => ({ value: p.id, label: `${p.name} (MRN: ${p.mrn})` }))]}
                />
                <Select
                  label="Attending Physician"
                  required
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  options={[{ value: '', label: 'Choose clinician' }, ...doctors.map((d) => ({ value: d.id, label: `${d.name} (${d.specialty})` }))]}
                />
                <Input
                  label="Primary Clinical Diagnosis *"
                  placeholder="e.g. Community-Acquired Pneumonia, resolved"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <Input
                  label="Medications & Dosing"
                  placeholder="e.g. Amoxicillin-Clavulanate 875/125mg PO BID x 7d"
                  value={rx}
                  onChange={(e) => setRx(e.target.value)}
                />
                <Textarea
                  label="Clinical Narrative & Plan"
                  placeholder="Patient afebrile for 48 hours. Lungs clear to auscultation bilaterally. Discharge planned for tomorrow morning..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="md:col-span-2"
                />
                <Input
                  label="Follow-Up Clinic Date"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
                <div className="flex items-end justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Sign & Commit Note</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : null}

        {/* Consults History Stream */}
        <motion.div variants={fadeUp} className="space-y-3">
          {consults.map((c) => {
            const p = patients.find((x) => x.id === c.patientId);
            const d = doctors.find((x) => x.id === c.doctorId);
            return (
              <Card key={c.id} hover className="transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={d?.name || 'Doctor'} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-ink-900">{d?.name || 'Attending Physician'}</h3>
                          <Badge tone="emerald" className="text-[10px]">
                            Signed
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-500">
                          Patient: <strong className="text-ink-900">{p?.name || 'Assigned Patient'}</strong>{' '}
                          {p?.mrn ? `(MRN: ${p.mrn})` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-ink-400">{formatDate(c.date)}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-ink-900">Diagnosis: </span>
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-800">
                        {c.diagnosis}
                      </span>
                    </div>

                    {c.notes && (
                      <p className="text-ink-600 leading-relaxed bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                        {c.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-ink-500">
                      {c.rx && (
                        <span className="flex items-center gap-1.5 font-medium text-ink-800">
                          <Pill className="h-3.5 w-3.5 text-brand-700" />
                          Rx: {c.rx}
                        </span>
                      )}
                      {c.followUp && (
                        <span className="flex items-center gap-1.5 font-medium text-amber-800">
                          <Calendar className="h-3.5 w-3.5 text-amber-600" />
                          Follow-up: {formatDate(c.followUp)}
                        </span>
                      )}
                    </div>
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
  icon: typeof FileText;
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
