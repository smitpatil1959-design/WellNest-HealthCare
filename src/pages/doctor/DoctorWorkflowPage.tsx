import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  FileText,
  ClipboardPlus,
  Users,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

export default function DoctorWorkflowPage() {
  const [testHealthId, setTestHealthId] = useState('');

  return (
    <>
      <Seo
        title="Clinical Care Workflow — Doctor Workspace"
        description="Standardized consent protocols for patient chart access, encounter recording, and e-prescribing."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Protocol"
          title="Clinical Care & Consent Workflow"
          description="Follow the standardized 4-stage protocol to verify patient identity, establish active consent windows, inspect diagnostic histories, and record signed clinical encounters."
          action={
            <Button
              to={paths.app.lookup}
              size="sm"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Lookup Patient ID
            </Button>
          }
        />

        {/* Operational Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Consent window"
            value="72-Hour Window"
            icon={Clock}
            subtext="Requested access duration"
          />
          <StatTile
            label="Access history"
            value="Recorded"
            icon={ShieldCheck}
            subtext="Lookup and consent activity"
          />
          <StatTile
            label="Chart access"
            value="Grant-scoped"
            icon={FileText}
            subtext="Requires active patient consent"
          />
          <StatTile
            label="Emergency override"
            value="Unavailable"
            icon={AlertTriangle}
            subtext="Follow facility emergency procedures"
          />
        </motion.div>

        {/* 4-Stage Interactive Care Flow */}
        <motion.div variants={fadeUp} className="space-y-4">
          <WorkflowStep
            step="01"
            title="Locate Patient by Universal Health ID"
            description="Enter the Health ID provided by the patient. Identity lookup returns only the matching profile details needed to confirm the patient."
            badges={['Identity Verification', 'Universal Registry']}
          >
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Enter patient Health ID..."
                  value={testHealthId}
                  onChange={(e) => setTestHealthId(e.target.value.toUpperCase())}
                />
              </div>
              <Button
                to={testHealthId ? `${paths.app.lookup}?id=${testHealthId}` : paths.app.lookup}
                size="sm"
                leftIcon={<Search className="h-4 w-4" />}
              >
                Validate Health ID
              </Button>
            </div>
          </WorkflowStep>

          <WorkflowStep
            step="02"
            title="Request Time-Bounded Clinical Consent"
            description="Submit a clinical purpose and request access. The patient reviews and decides whether to approve the request."
            badges={['Patient approval', 'Time-limited access']}
          >
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs text-ink-600">
              <span className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                ✓ Diagnostic Labs & Imaging
              </span>
              <span className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                ✓ Active Medication Regimens
              </span>
              <span className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                ✓ Prior Inpatient Summaries
              </span>
            </div>
          </WorkflowStep>

          <WorkflowStep
            step="03"
            title="Inspect Permitted Diagnostic Records"
            description="After approval, the patient appears in your consented panel. The chart exposes only categories permitted by the active grant."
            badges={['Approved categories', 'Active grant required']}
          >
            <div className="mt-3 flex flex-wrap gap-2">
              <Button to={paths.app.doctorPatients} variant="outline" size="sm" leftIcon={<Users className="h-3.5 w-3.5" />}>
                Open Consented Patient Panel
              </Button>
              <Button to={paths.app.doctorReports} variant="outline" size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                Review Diagnostic Reports
              </Button>
            </div>
          </WorkflowStep>

          <WorkflowStep
            step="04"
            title="Document Clinical Encounter & Issue Prescriptions"
            description="Document a visit note or issue a prescription only when the patient's active consent includes the relevant record category."
            badges={['Saved encounter', 'Consent required']}
          >
            <div className="mt-3 flex flex-wrap gap-2">
              <Button to={paths.app.doctorPrescriptions} size="sm" leftIcon={<ClipboardPlus className="h-3.5 w-3.5" />}>
                Write Electronic Prescription
              </Button>
            </div>
          </WorkflowStep>
        </motion.div>

        {/* Emergency guidance */}
        <motion.div variants={fadeUp}>
          <Card className="border-amber-200 bg-amber-50/40">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-900">Emergency care</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  This workspace does not provide an emergency consent override. For urgent situations, follow your facility's established emergency procedures.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}

function WorkflowStep({
  step,
  title,
  description,
  badges,
  children,
}: {
  step: string;
  title: string;
  description: string;
  badges: string[];
  children?: React.ReactNode;
}) {
  return (
    <Card className="transition-all hover:border-brand-200 hover:shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-800 font-display text-xl font-bold">
          {step}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink-900">{title}</h3>
            {badges.map((b) => (
              <Badge key={b} tone="slate" className="text-[10px]">
                {b}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">{description}</p>
          {children}
        </div>
      </div>
    </Card>
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
  icon: typeof ShieldCheck;
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
