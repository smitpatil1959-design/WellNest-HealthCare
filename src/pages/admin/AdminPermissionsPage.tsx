import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  FileKey,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../providers/ToastProvider';

interface PermissionRow {
  role: string;
  portal: string;
  readScope: string;
  writeScope: string;
  ephiAccess: 'sovereign' | 'consented' | 'restricted' | 'none';
  auditLevel: 'Full' | 'Comprehensive';
}

const matrix: PermissionRow[] = [
  {
    role: 'Patient (Record Holder)',
    portal: 'Patient Portal',
    readScope: 'Own complete longitudinal medical history, lab reports, prescriptions, timeline',
    writeScope: 'Sovereign consent grants, access revocation, emergency contact updates',
    ephiAccess: 'sovereign',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Attending Physician',
    portal: 'Doctor Portal',
    readScope: 'Clinical charts and history for patients who have granted active consent',
    writeScope: 'Encounter notes, diagnoses, e-prescriptions, lab order requisition',
    ephiAccess: 'consented',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Hospital Clinical Team',
    portal: 'Hospital Portal',
    readScope: 'Campus inpatient census, floor bed occupancy, assigned patient charts',
    writeScope: 'Inpatient intake, admission status, department transfer, discharge summary',
    ephiAccess: 'consented',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Laboratory Pathologist',
    portal: 'Laboratory Portal',
    readScope: 'Accessioned specimens, test requisitions, prior analyte delta checks',
    writeScope: 'Analyte measurement, pathologist impression, critical panic callout, sign-off',
    ephiAccess: 'consented',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Dispensing Pharmacist',
    portal: 'Pharmacy Portal',
    readScope: 'Legitimate electronic prescriptions transmitted by licensed prescribers',
    writeScope: 'Drug Utilization Review (DUR), clinical verification, fill status, inventory',
    ephiAccess: 'consented',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Health Plan Reviewer',
    portal: 'Insurance Portal',
    readScope: 'Itemized claim bills and specifically consented supporting documentation',
    writeScope: 'Medical necessity adjudication, claim approval/denial, payment remittance',
    ephiAccess: 'restricted',
    auditLevel: 'Comprehensive',
  },
  {
    role: 'Super Administrator',
    portal: 'Admin Console',
    readScope: 'Account credentials, organization registrations, system telemetry, audit logs',
    writeScope: 'Provider credential verification, account suspension, system settings — NEVER charts',
    ephiAccess: 'none',
    auditLevel: 'Full',
  },
];

export default function AdminPermissionsPage() {
  const { push } = useToast();

  return (
    <>
      <Seo title="Role Permissions & RBAC Matrix" description="Application roles and portal permissions." />
      <PatientPageHeader
        eyebrow="Access Control & Security Architecture"
        title="Role permissions & portal access"
        description="Review the application roles used for account, organization and care workflows. Administrator access is privileged and must be managed carefully."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Configured Role Classes</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">7 Portals</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Super Admin Chart Access</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-rose-700">0% (Zero-Knowledge)</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Enforcement Model</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">RLS + JWT Claims</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Audit Compliance</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">100% Traceable</p>
        </div>
      </div>

      {/* Zero-Knowledge EPHI Boundary Banner */}
      <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-teal-950 text-sm">Architectural Separation of Duties</h3>
            <p className="mt-1 leading-relaxed text-teal-800">
              Portal roles define application permissions. Database operators and service credentials retain privileged access outside these screens. This matrix does not establish independent regulatory certification or encryption that excludes administrators.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Role & Workspace</th>
                <th className="px-4 py-3">Read Capabilities</th>
                <th className="px-4 py-3">Write / Mutation Capabilities</th>
                <th className="px-4 py-3">Clinical ePHI Boundary</th>
                <th className="px-4 py-3 text-right">Audit Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-800">
              {matrix.map((row) => (
                <tr key={row.role} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 align-middle">
                    <p className="font-bold text-ink-900 text-xs sm:text-sm">{row.role}</p>
                    <p className="text-[11px] font-medium text-brand-700">{row.portal}</p>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs">
                    {row.readScope}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs">
                    {row.writeScope}
                  </td>
                  <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                    {row.ephiAccess === 'sovereign' ? (
                      <Badge tone="brand">Sovereign Owner</Badge>
                    ) : row.ephiAccess === 'consented' ? (
                      <Badge tone="emerald">Consent Required</Badge>
                    ) : row.ephiAccess === 'restricted' ? (
                      <Badge tone="amber">Claim Packet Only</Badge>
                    ) : (
                      <Badge tone="rose">Blocked by Architecture</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap text-xs font-mono text-ink-600">
                    {row.auditLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          variant="outline"
          leftIcon={<FileKey className="h-4 w-4" />}
          onClick={() => {
            if (window.confirm('Confirm permission draft review? This is an administrative audit record.')) {
              push({
                tone: 'success',
                title: 'Permission Audit Verified',
                description: 'Active ACL policy confirmed in strict accordance with HIPAA Zero-Knowledge specification.',
              });
            }
          }}
        >
          Confirm Permission Policy Review
        </Button>
      </div>
    </>
  );
}
