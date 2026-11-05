import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Stethoscope,
  FlaskConical,
  User,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { VerificationPill } from '../../components/doctor/VerificationPill';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { formatDate } from '../../utils/format';
import { useToast } from '../../providers/ToastProvider';
import type { ReportSource } from '../../types/hospital';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalReportsPage() {
  const { reports, patients, addReport, can } = useHospitalPortal();
  const { push } = useToast();
  const [title, setTitle] = useState('');
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const source: ReportSource = 'hospital';
  const [summary, setSummary] = useState('');
  const [type, setType] = useState('Progress Note');
  const [showFileForm, setShowFileForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | ReportSource>('all');

  const verifiedCount = reports.filter((r) => r.verified).length;
  const pendingReviewCount = reports.filter((r) => !r.verified).length;

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const p = patients.find((x) => x.id === rep.patientId);
      const matchSearch = `${rep.title} ${rep.type} ${p?.name || ''} ${rep.uploader || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchSource = sourceFilter === 'all' || rep.source === sourceFilter;
      return matchSearch && matchSource;
    });
  }, [reports, patients, searchTerm, sourceFilter]);

  return (
    <>
      <Seo
        title="Clinical Reports & HIM Vault — Hospital Command"
        description="Health Information Management (HIM) diagnostic reports, inpatient notes, and pathology releases."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Health Information Management (HIM)"
          title="Clinical Documentation & Reports"
          description="Maintain and verify hospital-originated diagnostic imaging, surgical summaries, inpatient progress notes, and patient-submitted documentation."
          action={
            can('reports') || can('all') ? (
              <Button
                size="sm"
                onClick={() => setShowFileForm(!showFileForm)}
                leftIcon={<UploadCloud className="h-4 w-4" />}
              >
                {showFileForm ? 'Close Intake' : 'Attach Clinical Document'}
              </Button>
            ) : undefined
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Reports"
            value={reports.length}
            icon={FileText}
            subtext="Archived documents"
          />
          <StatTile
            label="Hospital Verified"
            value={verifiedCount}
            icon={ShieldCheck}
            subtext="Reviewed records"
          />
          <StatTile
            label="Pending Review"
            value={pendingReviewCount}
            icon={Clock}
            subtext="Patient uploaded"
          />
          <StatTile
            label="Patient sharing"
            value="Consent based"
            icon={CheckCircle2}
            subtext="Authorized linked accounts"
          />
        </motion.div>

        {/* File Report Form Card */}
        {(can('reports') || can('all')) && showFileForm ? (
          <motion.div variants={fadeUp}>
            <Card className="border-brand-200/80 bg-brand-50/20">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Attach Verified Hospital Record</h2>
                <p className="text-xs text-ink-500">
                  Select the patient chart and upload the finalized clinical encounter document
                </p>
              </div>
              <form
                className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!title.trim()) return;
                  const saved = await addReport({
                    patientId,
                    title,
                    type,
                    date: new Date().toISOString().slice(0, 10),
                    source,
                    uploader: '',
                    verified: false,
                    summary,
                  });
                  if (!saved) return;
                  setTitle('');
                  setSummary('');
                  setShowFileForm(false);
                  push({ tone: 'success', title: 'Clinical report attached to chart' });
                }}
              >
                <Select
                  label="Target Patient Chart"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  options={[{ value: '', label: 'Choose a patient chart' }, ...patients.map((p) => ({ value: p.id, label: `${p.name} (MRN: ${p.mrn})` }))]}
                />
                <Input
                  label="Document Title"
                  placeholder="e.g. Post-Op Laparoscopy Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  label="Clinical Modality / Type"
                  placeholder="e.g. Surgical Pathology"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
                <Textarea required label="Clinical summary" value={summary} onChange={event => setSummary(event.target.value)} />
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button type="button" variant="ghost" onClick={() => setShowFileForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Publish to Chart</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : null}

        {/* Search & Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search reports by title, patient name, modality, or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'hospital', 'doctor', 'laboratory', 'patient'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSourceFilter(s)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  sourceFilter === s
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'All Sources' : s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reports Worklist */}
        <motion.div variants={fadeUp} className="space-y-3">
          {filteredReports.map((r) => {
            const p = patients.find((x) => x.id === r.patientId);
            return (
              <Card key={r.id} hover className="transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        r.verified
                          ? 'border-brand-200 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {r.source === 'laboratory' ? (
                        <FlaskConical className="h-5 w-5" />
                      ) : r.source === 'doctor' ? (
                        <Stethoscope className="h-5 w-5" />
                      ) : r.source === 'patient' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink-900">{r.title}</h3>
                        <Badge tone="slate" className="text-[10px]">
                          {r.type}
                        </Badge>
                        <VerificationPill source={r.verified ? r.source : 'unverified'} />
                      </div>
                      <p className="text-xs text-ink-600">
                        Patient: <strong className="text-ink-900">{p?.name || 'Assigned Patient'}</strong>{' '}
                        {p?.mrn ? `(MRN: ${p.mrn})` : ''} · Uploader: {r.uploader}
                      </p>
                      <p className="text-xs text-ink-400">
                        {r.summary || 'Clinical report certified for medical record.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs text-ink-400 font-mono">{formatDate(r.date)}</span>
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
