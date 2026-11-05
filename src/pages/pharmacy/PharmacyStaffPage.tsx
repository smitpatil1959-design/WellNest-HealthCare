import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Pill,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
  FileCheck2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import type { PharmacyStaffRole } from '../../types/pharmacy';

interface PharmacyRoleDef {
  id: PharmacyStaffRole;
  label: string;
  licenseTitle: string;
  description: string;
  capabilities: { name: string; allowed: boolean }[];
  boardRule: string;
}

const roles: PharmacyRoleDef[] = [
  {
    id: 'pharmacist-in-charge',
    label: 'Pharmacist-in-Charge (PIC)',
    licenseTitle: 'Licensed PharmD / Managing Pharmacist',
    description: 'Full legal accountability for pharmacy licensure, DEA Form 222 execution, quality assurance, and staff oversight.',
    boardRule: 'Designated PIC under State Board of Pharmacy license.',
    capabilities: [
      { name: 'Prescription Ingestion & Intake', allowed: true },
      { name: 'Drug Utilization Review (DUR) Override', allowed: true },
      { name: 'Clinical Verification & Fill Authorization', allowed: true },
      { name: 'Controlled Substance Schedule II Log Signing', allowed: true },
      { name: 'Patient Consultation & Regimen Education', allowed: true },
      { name: 'Dispense Handout & POS Release', allowed: true },
    ],
  },
  {
    id: 'pharmacist',
    label: 'Staff Pharmacist',
    licenseTitle: 'Registered Pharmacist (RPh / PharmD)',
    description: 'Clinical evaluation of incoming electronic scripts, allergy screening, dosage checks, and patient counseling.',
    boardRule: 'Licensed to practice pharmacy; authorized for clinical verification and consultation.',
    capabilities: [
      { name: 'Prescription Ingestion & Intake', allowed: true },
      { name: 'Drug Utilization Review (DUR) Override', allowed: true },
      { name: 'Clinical Verification & Fill Authorization', allowed: true },
      { name: 'Controlled Substance Schedule II Log Signing', allowed: false },
      { name: 'Patient Consultation & Regimen Education', allowed: true },
      { name: 'Dispense Handout & POS Release', allowed: true },
    ],
  },
  {
    id: 'technician',
    label: 'Certified Pharmacy Technician (CPhT)',
    licenseTitle: 'PTCB Certified Pharmacy Technician',
    description: 'Medication counting, robotic dispensing cell loading, label printing, and inventory stock replenishment.',
    boardRule: 'Restricted from clinical drug verification or clinical patient counseling.',
    capabilities: [
      { name: 'Prescription Ingestion & Intake', allowed: true },
      { name: 'Drug Utilization Review (DUR) Override', allowed: false },
      { name: 'Clinical Verification & Fill Authorization', allowed: false },
      { name: 'Controlled Substance Schedule II Log Signing', allowed: false },
      { name: 'Patient Consultation & Regimen Education', allowed: false },
      { name: 'Dispense Handout & POS Release', allowed: true },
    ],
  },
  {
    id: 'cashier',
    label: 'Pharmacy Intake & Dispense Clerk',
    licenseTitle: 'Pharmacy Customer Service Representative',
    description: 'Patient greeting, insurance card scanning, pickup bin retrieval, and payment processing.',
    boardRule: 'Strictly limited to ready orders and co-pay collection. No clinical involvement.',
    capabilities: [
      { name: 'Prescription Ingestion & Intake', allowed: false },
      { name: 'Drug Utilization Review (DUR) Override', allowed: false },
      { name: 'Clinical Verification & Fill Authorization', allowed: false },
      { name: 'Controlled Substance Schedule II Log Signing', allowed: false },
      { name: 'Patient Consultation & Regimen Education', allowed: false },
      { name: 'Dispense Handout & POS Release', allowed: true },
    ],
  },
];

export default function PharmacyStaffPage() {
  const { role, setRole, can, organization, memberCount } = usePharmacyPortal();

  return (
    <>
      <Seo title="Pharmacy Roles & Safety Governance" description="Board of Pharmacy credentialing, verification privileges, and staff roles." />
      <PatientPageHeader
        eyebrow="Clinical Safety & Governance"
        title="Pharmacy roles & fill authorization"
        description="Only a licensed pharmacist can clinically verify and authorize medication fills. Unsigned patient photo uploads cannot be filled without provider verification."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Your Active Role</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-brand-900 capitalize">
            {role ? role.replace(/-/g, ' ') : 'Pharmacist'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Licensed Staff</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">{memberCount} Members</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Board Certification</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">Active Good Standing</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">DUR Compliance</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-emerald-900">100% Enforced</p>
        </div>
      </div>

      {/* Active Privileges Banner */}
      <Card className="mb-6 border-slate-200/80 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-700 border border-teal-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Active Shift Dispensing Credentials</h3>
              <p className="text-xs text-ink-500">
                Operating under: <strong className="text-ink-800">{organization?.display_name || 'Aurelia Pharmacy'}</strong>
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
              Clinical Fill Verification: {can('verify') || can('all') ? 'Authorized' : 'Restricted'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('inventory') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('inventory') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Stock Adjustments: {can('inventory') || can('all') ? 'Authorized' : 'Restricted'}
            </span>
          </div>
        </div>
      </Card>

      {/* Role Directory Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {roles.map((r) => {
          const isCurrent = role === r.id;
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setRole(r.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole(r.id); }}
              className="text-left cursor-pointer focus:outline-hidden"
            >
              <Card
                className={`transition-all h-full ${
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
                          Active Preview
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold text-brand-700 mt-0.5">{r.licenseTitle}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-600">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-ink-600 leading-relaxed">{r.description}</p>

                {/* Capabilities */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">Capability Scope</p>
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
                  <strong className="text-ink-700">Board Mandate:</strong> {r.boardRule}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </>
  );
}
