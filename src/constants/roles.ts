import { paths } from '../routes/paths';
import type { RoleDefinition, UserRole } from '../types/roles';

export const roleDefinitions: Record<UserRole, RoleDefinition> = {
  patient: {
    id: 'patient',
    label: 'Patient',
    headline: 'Own every chapter of your health story.',
    description:
      'Patients hold a lifetime record that travels with them — visits, labs, prescriptions, imaging, and insurance events, verified at the source.',
    audience: 'Individuals and families',
    path: paths.roles.patient,
    accent: 'brand',
    capabilities: [
      { id: 'p1', title: 'Lifetime timeline', description: 'A single, chronological record across every provider you visit.' },
      { id: 'p2', title: 'Consent control', description: 'Grant, pause, or revoke access with a clear audit trail.' },
      { id: 'p3', title: 'Verified results', description: 'Labs and prescriptions arrive signed by the issuing organization.' },
    ],
    records: ['Visits', 'Allergies', 'Medications', 'Lab results', 'Imaging', 'Immunizations'],
  },
  doctor: {
    id: 'doctor',
    label: 'Doctor',
    headline: 'See the full clinical picture before you walk in.',
    description:
      'Physicians receive consented, source-verified history so every consult starts with context instead of a clipboard.',
    audience: 'Physicians and specialists',
    path: paths.roles.doctor,
    accent: 'brand',
    capabilities: [
      { id: 'd1', title: 'Longitudinal chart', description: 'Read across hospitals, labs, and pharmacies — not just your EHR.' },
      { id: 'd2', title: 'Signed orders', description: 'Issue prescriptions and referrals with organizational attestation.' },
      { id: 'd3', title: 'Safer handoffs', description: 'Share a verified summary when a patient changes care teams.' },
    ],
    records: ['Notes', 'Orders', 'Referrals', 'Care plans', 'Follow-ups'],
  },
  hospital: {
    id: 'hospital',
    label: 'Hospital',
    headline: 'Coordinate care without losing the record.',
    description:
      'Hospitals become trusted issuers of encounters, procedures, and discharge summaries that remain with the patient for life.',
    audience: 'Health systems and clinics',
    path: paths.roles.hospital,
    accent: 'emerald',
    capabilities: [
      { id: 'h1', title: 'Encounter issuance', description: 'Publish admissions, procedures, and discharges as verified events.' },
      { id: 'h2', title: 'Directory of clinicians', description: 'Map departments and attending physicians to every record.' },
      { id: 'h3', title: 'Transfer continuity', description: 'Keep history intact when patients move between campuses.' },
    ],
    records: ['Admissions', 'Procedures', 'Discharges', 'Operative notes', 'Nursing summaries'],
  },
  laboratory: {
    id: 'laboratory',
    label: 'Laboratory',
    headline: 'Results that cannot be forged or lost.',
    description:
      'Laboratories issue signed panels that attach to the patient record the moment they are released — no portals, no PDFs in inboxes.',
    audience: 'Clinical and diagnostic labs',
    path: paths.roles.laboratory,
    accent: 'sky',
    capabilities: [
      { id: 'l1', title: 'Signed panels', description: 'Attach provenance to every CBC, metabolic panel, and pathology report.' },
      { id: 'l2', title: 'Order matching', description: 'Close the loop from physician order to released result.' },
      { id: 'l3', title: 'Trend-ready data', description: 'Structured values, not scanned printouts, so trends stay readable.' },
    ],
    records: ['Hematology', 'Chemistry', 'Microbiology', 'Pathology', 'Genetics'],
  },
  pharmacy: {
    id: 'pharmacy',
    label: 'Pharmacy',
    headline: 'Dispense against a living medication list.',
    description:
      'Pharmacies see consented, current therapy — and write fill events back to the lifetime record with lot and counseling notes.',
    audience: 'Retail and hospital pharmacies',
    path: paths.roles.pharmacy,
    accent: 'emerald',
    capabilities: [
      { id: 'ph1', title: 'Live medication list', description: 'Dispense against allergies, interactions, and active therapies.' },
      { id: 'ph2', title: 'Fill attestation', description: 'Record each dispense as a verified event on the patient timeline.' },
      { id: 'ph3', title: 'Adherence context', description: 'Share counseling and refill status with the care team.' },
    ],
    records: ['Prescriptions', 'Fills', 'Counseling', 'Interactions', 'Refills'],
  },
  insurance: {
    id: 'insurance',
    label: 'Insurance',
    headline: 'Authorize care from verified clinical facts.',
    description:
      'Payers review consented, source-signed records instead of chasing faxes — faster authorizations, fewer disputes.',
    audience: 'Health plans and TPAs',
    path: paths.roles.insurance,
    accent: 'brand',
    capabilities: [
      { id: 'i1', title: 'Evidence-based review', description: 'Read signed encounters and labs instead of reconstructed claims.' },
      { id: 'i2', title: 'Faster authorizations', description: 'Reduce back-and-forth with a shared source of truth.' },
      { id: 'i3', title: 'Audit-ready access', description: 'Every look-up is consented, timed, and attributable.' },
    ],
    records: ['Authorizations', 'Claims context', 'Eligibility', 'Appeals evidence'],
  },
  administrator: {
    id: 'administrator',
    label: 'Administrator',
    headline: 'Govern the ecosystem with precision.',
    description:
      'Platform administrators oversee organizations, credentials, audit logs, and policy — never clinical content they are not entitled to see.',
    audience: 'WellNest operators and compliance',
    path: paths.roles.administrator,
    accent: 'ink',
    capabilities: [
      { id: 'a1', title: 'Organization directory', description: 'Onboard hospitals, labs, pharmacies, and plans with verified identity.' },
      { id: 'a2', title: 'Credentialing', description: 'Issue and revoke practitioner and facility credentials.' },
      { id: 'a3', title: 'Immutable audit', description: 'Inspect access, consent, and issuance without reading charts.' },
    ],
    records: ['Orgs', 'Credentials', 'Policies', 'Audit events', 'Incidents'],
  },
};

export const roleList = Object.values(roleDefinitions);
