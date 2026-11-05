import {
  ShieldCheck,
  ShieldAlert,
  Award,
  FileCheck2,
  FlaskConical,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useLabPortal } from '../../hooks/useLabPortal';
import type { LabStaffRole } from '../../types/lab';

interface RoleDefinition {
  id: LabStaffRole;
  label: string;
  cliaTitle: string;
  description: string;
  capabilities: { name: string; allowed: boolean }[];
  regulatoryNote: string;
}

const roles: RoleDefinition[] = [
  {
    id: 'director',
    label: 'Laboratory Director',
    cliaTitle: 'CLIA Medical Director (MD / PhD)',
    description: 'Ultimate clinical oversight, assay validation, quality management system, and personnel authorization.',
    regulatoryNote: 'Meets 42 CFR § 493.1441 for High Complexity Laboratory Direction.',
    capabilities: [
      { name: 'Specimen Accession & Test Intake', allowed: true },
      { name: 'Analyte Entry & Compose Drafts', allowed: true },
      { name: 'Pathologist Verification & Delta Check', allowed: true },
      { name: 'STAT Critical Verbal Readback', allowed: true },
      { name: 'Timeline Publication to Patient & EHR', allowed: true },
      { name: 'Laboratory Analytics & Audit Inspection', allowed: true },
    ],
  },
  {
    id: 'pathologist',
    label: 'Clinical Pathologist',
    cliaTitle: 'Board-Certified Pathologist',
    description: 'Specialist physician sign-off for diagnostic panels, delta checks, abnormal morphology, and critical panics.',
    regulatoryNote: 'Authorized to digitally certify diagnostic release under institutional CLIA licensure.',
    capabilities: [
      { name: 'Specimen Accession & Test Intake', allowed: false },
      { name: 'Analyte Entry & Compose Drafts', allowed: true },
      { name: 'Pathologist Verification & Delta Check', allowed: true },
      { name: 'STAT Critical Verbal Readback', allowed: true },
      { name: 'Timeline Publication to Patient & EHR', allowed: true },
      { name: 'Laboratory Analytics & Audit Inspection', allowed: true },
    ],
  },
  {
    id: 'technologist',
    label: 'Medical Laboratory Scientist (MLS / MLT)',
    cliaTitle: 'Certified Clinical Laboratory Technologist',
    description: 'Performs specimen handling, instrumentation calibration, QC runs, and initial analyte entry.',
    regulatoryNote: 'ASCP / AMT certified. May enter and draft reports; cannot sign off final release.',
    capabilities: [
      { name: 'Specimen Accession & Test Intake', allowed: true },
      { name: 'Analyte Entry & Compose Drafts', allowed: true },
      { name: 'Pathologist Verification & Delta Check', allowed: false },
      { name: 'STAT Critical Verbal Readback', allowed: false },
      { name: 'Timeline Publication to Patient & EHR', allowed: false },
      { name: 'Laboratory Analytics & Audit Inspection', allowed: false },
    ],
  },
  {
    id: 'receptionist',
    label: 'Accession & Specimen Intake Clerk',
    cliaTitle: 'Laboratory Accessioner',
    description: 'Manages physical specimen drop-off, patient ID matching, barcoding, and initial accession tracking.',
    regulatoryNote: 'Restricted from clinical data entry or diagnostic interpretation.',
    capabilities: [
      { name: 'Specimen Accession & Test Intake', allowed: true },
      { name: 'Analyte Entry & Compose Drafts', allowed: false },
      { name: 'Pathologist Verification & Delta Check', allowed: false },
      { name: 'STAT Critical Verbal Readback', allowed: false },
      { name: 'Timeline Publication to Patient & EHR', allowed: false },
      { name: 'Laboratory Analytics & Audit Inspection', allowed: false },
    ],
  },
];

export default function LabStaffPage() {
  const { role, can, memberCount, organization } = useLabPortal();

  return (
    <>
      <Seo title="Laboratory Staff Roles & Privileges" description="CLIA compliance, credentialing, and clinical role permissions." />
      <PatientPageHeader
        eyebrow="Clinical Governance & CLIA"
        title="Staff roles & verification privileges"
        description="Strict role-based segregation ensures diagnostic authenticity. Only certified pathologists sign reports; specimen accessioners cannot invent test results."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Your Assigned Role</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-brand-900 capitalize">
            {role ? role.replace('-', ' ') : 'Technologist'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Active Staff Roster</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">{memberCount} Members</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Accreditation Tier</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">CAP / CLIA</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Legal Audit Status</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-emerald-900">Enforced</p>
        </div>
      </div>

      {/* Active Session Privileges Banner */}
      <Card className="mb-6 border-slate-200/80 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-700 border border-teal-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Live Active Session Privileges</h3>
              <p className="text-xs text-ink-500">
                Operating under facility: <strong className="text-ink-800">{organization?.display_name || 'WellNest Reference Laboratory'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('verify') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('verify') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Pathologist Sign-Off: {can('verify') || can('all') ? 'Permitted' : 'Restricted'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('publish') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('publish') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Portal Release: {can('publish') || can('all') ? 'Permitted' : 'Restricted'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('compose') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('compose') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Draft Compose: {can('compose') || can('all') ? 'Permitted' : 'Restricted'}
            </span>
          </div>
        </div>
      </Card>

      {/* Role Capability Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {roles.map((r) => {
          const isCurrent = role === r.id;
          return (
            <Card
              key={r.id}
              className={`transition-all ${
                isCurrent
                  ? 'border-brand-400 bg-brand-50/10 shadow-sm ring-1 ring-brand-300'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-900 text-base">{r.label}</h3>
                    {isCurrent ? (
                      <Badge tone="brand" className="text-[10px]">
                        Your Active Role
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs font-semibold text-brand-700 mt-0.5">{r.cliaTitle}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-600">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-2.5 text-xs text-ink-600 leading-relaxed">{r.description}</p>

              {/* Capabilities checklist */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">Capability Matrix</p>
                <div className="space-y-1.5">
                  {r.capabilities.map((cap) => (
                    <div key={cap.name} className="flex items-center justify-between text-xs">
                      <span className={cap.allowed ? 'text-ink-800 font-medium' : 'text-ink-400'}>{cap.name}</span>
                      {cap.allowed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-[11px] text-ink-500 border border-slate-100">
                <strong className="text-ink-700">CLIA Mandate:</strong> {r.regulatoryNote}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
