import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Building2,
  Stethoscope,
  Users,
  Eye,
  FileText,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import type { HospitalStaffRole } from '../../types/hospital';
import { fadeUp, stagger } from '../../animations/variants';

const roles: {
  id: HospitalStaffRole;
  label: string;
  category: string;
  description: string;
  capabilities: { name: string; allowed: boolean }[];
}[] = [
  {
    id: 'admin',
    label: 'Hospital Executive Administrator',
    category: 'System Governance',
    description: 'Full supervisory authority across all wards, staff credentials, and financial metrics.',
    capabilities: [
      { name: 'Master Patient Index Access', allowed: true },
      { name: 'Patient Intake Registration', allowed: true },
      { name: 'Attending Physician Credentialing', allowed: true },
      { name: 'Service Line & Ward Configuration', allowed: true },
      { name: 'HIM Clinical Report Filing', allowed: true },
      { name: 'Inpatient Discharge Authorization', allowed: true },
    ],
  },
  {
    id: 'doctor',
    label: 'Attending & Resident Physician',
    category: 'Clinical Care',
    description: 'Document consult notes, sign medical orders, review lab panels, and execute discharges.',
    capabilities: [
      { name: 'Master Patient Index Access', allowed: true },
      { name: 'Patient Intake Registration', allowed: false },
      { name: 'Attending Physician Credentialing', allowed: false },
      { name: 'Consult Notes & Orders', allowed: true },
      { name: 'Diagnostic Lab Review', allowed: true },
      { name: 'Inpatient Discharge Authorization', allowed: true },
    ],
  },
  {
    id: 'receptionist',
    label: 'Intake Clerk & Receptionist',
    category: 'Front Desk & Patient Flow',
    description: 'Admit new patients, verify Health IDs, and manage clinic scheduling queues.',
    capabilities: [
      { name: 'Master Patient Index Access', allowed: true },
      { name: 'Patient Intake Registration', allowed: true },
      { name: 'Physician Availability Directory', allowed: true },
      { name: 'Consult Notes & Orders', allowed: false },
      { name: 'Diagnostic Lab Review', allowed: false },
      { name: 'Inpatient Discharge Authorization', allowed: false },
    ],
  },
  {
    id: 'nurse',
    label: 'Floor Registered Nurse (RN)',
    category: 'Inpatient Care',
    description: 'Monitor bed censuses, administer physician orders, and execute bedside discharge instructions.',
    capabilities: [
      { name: 'Master Patient Index Access', allowed: true },
      { name: 'Inpatient Bed Census Tracking', allowed: true },
      { name: 'Clinic Appointments View', allowed: true },
      { name: 'Consult Notes & Orders', allowed: false },
      { name: 'Diagnostic Lab Review', allowed: true },
      { name: 'Inpatient Discharge Authorization', allowed: false },
    ],
  },
  {
    id: 'laboratory',
    label: 'Hospital Laboratory Liaison',
    category: 'Diagnostic Services',
    description: 'Receive hospital specimen orders, track accessioning, and publish findings.',
    capabilities: [
      { name: 'Master Patient Index Access', allowed: false },
      { name: 'Patient Intake Registration', allowed: false },
      { name: 'Laboratory Order Bench Tracking', allowed: true },
      { name: 'Diagnostic Report Publishing', allowed: true },
      { name: 'Inpatient Discharge Authorization', allowed: false },
      { name: 'Ward Configuration', allowed: false },
    ],
  },
];

export default function HospitalStaffPage() {
  const { staffRole, can } = useHospitalPortal();
  const [previewRole, setStaffRole] = useState(staffRole);

  const activeRoleData = roles.find((r) => r.id === (previewRole || staffRole)) || roles[0];

  return (
    <>
      <Seo
        title="Institutional RBAC & Staff Roles — Hospital Command"
        description="Role-based access control (RBAC) governance, clinical permission boundaries, and privilege preview."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Governance & RBAC"
          title="Hospital Staff Roles & Permissions"
          description={`Your assigned role is ${staffRole}. Selecting a card previews its capabilities; it does not change your account’s permissions.`}
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Active Preview Role"
            value={activeRoleData.label.split(' ')[0]}
            icon={UserCheck}
            subtext={activeRoleData.category}
          />
          <StatTile
            label="Security Model"
            value="Zero-Trust RBAC"
            icon={ShieldCheck}
            subtext="Least privilege"
          />
          <StatTile
            label="Audit Enforcement"
            value="100% Logged"
            icon={Lock}
            subtext="Server activity log"
          />
          <StatTile
            label="Access source"
            value="Verified membership"
            icon={KeyRound}
            subtext="Role authorization boundary"
          />
        </motion.div>

        {/* Role Cards Grid */}
        <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const isSelected = (previewRole || staffRole) === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setStaffRole(role.id)}
                className="text-left"
              >
                <Card
                  hover
                  className={`h-full transition-all ${
                    isSelected
                      ? 'border-brand-600 ring-2 ring-brand-100 bg-brand-50/20'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                        {role.category}
                      </span>
                      <h3 className="mt-0.5 text-sm font-bold text-ink-900">{role.label}</h3>
                    </div>
                    {isSelected ? (
                      <Badge tone="emerald" className="text-[10px]">
                        Active Preview
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    {role.description}
                  </p>
                </Card>
              </button>
            );
          })}
        </motion.div>

        {/* Permission Capability Matrix for Selected Role */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink-900">
                    Capability Matrix: {activeRoleData.label}
                  </h3>
                  <p className="text-xs text-ink-500">
                    Verified privileges enforced when authenticated under this profile
                  </p>
                </div>
                <Badge tone="slate">{activeRoleData.category}</Badge>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeRoleData.capabilities.map((cap) => (
                <div
                  key={cap.name}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                    cap.allowed
                      ? 'border-emerald-100 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-100 bg-slate-50 text-ink-400'
                  }`}
                >
                  <span className="font-medium">{cap.name}</span>
                  {cap.allowed ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Allowed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                      <XCircle className="h-4 w-4" /> Denied
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
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
  value: string;
  subtext: string;
  icon: typeof UserCheck;
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
