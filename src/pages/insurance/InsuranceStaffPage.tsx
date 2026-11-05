import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
  Lock,
  Scale,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import type { InsurerStaffRole } from '../../types/insurance';

interface InsuranceRoleDef {
  id: InsurerStaffRole;
  label: string;
  formalTitle: string;
  description: string;
  capabilities: { name: string; allowed: boolean }[];
  regulatoryScope: string;
}

const roles: InsuranceRoleDef[] = [
  {
    id: 'admin',
    label: 'Plan Administrator',
    formalTitle: 'Chief Operating Officer / Medical Director',
    description: 'Total operational governance across member policies, claim underwriting parameters, SIU fraud escalations, and financial reserves.',
    regulatoryScope: 'Full authority across all benefit schedules and financial disbursements.',
    capabilities: [
      { name: 'Policy Underwriting & Rate Schedule Setup', allowed: true },
      { name: 'Claims Adjudication & Medical Review', allowed: true },
      { name: 'Direct Claim Settlement & Payment Release', allowed: true },
      { name: 'SIU Fraud Desk Escalation & Lockout', allowed: true },
      { name: 'Member Enrollment & Profile Management', allowed: true },
      { name: 'Actuarial Analytics & CMS Solvency Inspection', allowed: true },
    ],
  },
  {
    id: 'reviewer',
    label: 'Claims Examiner',
    formalTitle: 'Senior Clinical Claims Adjudicator',
    description: 'Reviews itemized bills, verifies clinical documentation attached by providers, checks medical necessity, and approves or denies claims.',
    regulatoryScope: 'Authorized for medical necessity determinations up to delegated financial limits.',
    capabilities: [
      { name: 'Policy Underwriting & Rate Schedule Setup', allowed: false },
      { name: 'Claims Adjudication & Medical Review', allowed: true },
      { name: 'Direct Claim Settlement & Payment Release', allowed: true },
      { name: 'SIU Fraud Desk Escalation & Lockout', allowed: true },
      { name: 'Member Enrollment & Profile Management', allowed: false },
      { name: 'Actuarial Analytics & CMS Solvency Inspection', allowed: true },
    ],
  },
  {
    id: 'policy-manager',
    label: 'Policy & Enrollment Manager',
    formalTitle: 'Underwriting & Enrollment Specialist',
    description: 'Maintains employer group plans, individual policies, deductible tracking, dependent rosters, and renewal dates.',
    regulatoryScope: 'Restricted from clinical claims review or payment adjudication.',
    capabilities: [
      { name: 'Policy Underwriting & Rate Schedule Setup', allowed: true },
      { name: 'Claims Adjudication & Medical Review', allowed: false },
      { name: 'Direct Claim Settlement & Payment Release', allowed: false },
      { name: 'SIU Fraud Desk Escalation & Lockout', allowed: false },
      { name: 'Member Enrollment & Profile Management', allowed: true },
      { name: 'Actuarial Analytics & CMS Solvency Inspection', allowed: false },
    ],
  },
  {
    id: 'support',
    label: 'Member Services Advocate',
    formalTitle: 'Patient Concierge & Benefits Support',
    description: 'Assists policyholders with copay inquiries, explanation of benefits (EOB) walk-throughs, and network directory verification.',
    regulatoryScope: 'Strictly read-only access to member profile and claim status. No clinical approval privileges.',
    capabilities: [
      { name: 'Policy Underwriting & Rate Schedule Setup', allowed: false },
      { name: 'Claims Adjudication & Medical Review', allowed: false },
      { name: 'Direct Claim Settlement & Payment Release', allowed: false },
      { name: 'SIU Fraud Desk Escalation & Lockout', allowed: false },
      { name: 'Member Enrollment & Profile Management', allowed: true },
      { name: 'Actuarial Analytics & CMS Solvency Inspection', allowed: false },
    ],
  },
  {
    id: 'auditor',
    label: 'SIU Compliance Auditor',
    formalTitle: 'Special Investigation Unit (SIU) Officer',
    description: 'Investigates duplicate billings, unbundled CPT codes, suspicious geographic patterns, and provider fraud rings.',
    regulatoryScope: 'Investigative authority with read-led audit access across all claims and documents.',
    capabilities: [
      { name: 'Policy Underwriting & Rate Schedule Setup', allowed: false },
      { name: 'Claims Adjudication & Medical Review', allowed: false },
      { name: 'Direct Claim Settlement & Payment Release', allowed: false },
      { name: 'SIU Fraud Desk Escalation & Lockout', allowed: true },
      { name: 'Member Enrollment & Profile Management', allowed: false },
      { name: 'Actuarial Analytics & CMS Solvency Inspection', allowed: true },
    ],
  },
];

export default function InsuranceStaffPage() {
  const { role, setRole, can, organization, memberCount } = useInsurancePortal();

  return (
    <>
      <Seo title="Insurance Staff Roles & Permissions" description="Adjudication privileges, claims reviewer roles, and privacy governance." />
      <PatientPageHeader
        eyebrow="Compliance & Governance"
        title="Insurance staff roles & review privileges"
        description="Reviewers decide medical necessity. Member support representatives cannot pay claims. Private patient charts remain strictly off this desk unless consented evidence is attached."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Your Active Role</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-brand-900 capitalize">
            {role ? role.replace(/-/g, ' ') : 'Reviewer'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Plan Staff</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">{memberCount} Members</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Adjudication Tier</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink-900">Level II Clinical</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Chart Privacy Lock</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-emerald-900">Enforced</p>
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
              <h3 className="text-sm font-bold text-ink-900">Active Shift Adjudication Credentials</h3>
              <p className="text-xs text-ink-500">
                Operating under: <strong className="text-ink-800">{organization?.display_name || 'Solace Health Plan'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('review') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('review') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Claims Review & Adjudication: {can('review') || can('all') ? 'Authorized' : 'Restricted'}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                can('policies') || can('all')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {can('policies') || can('all') ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Policy Underwriting: {can('policies') || can('all') ? 'Authorized' : 'Restricted'}
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
                    <p className="text-xs font-semibold text-brand-700 mt-0.5">{r.formalTitle}</p>
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
                  <strong className="text-ink-700">Governance Scope:</strong> {r.regulatoryScope}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </>
  );
}
