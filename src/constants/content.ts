import type { FaqItem, Testimonial } from '../types';

export const heroStats = [
  { value: '1', label: 'Lifetime record per person' },
  { value: '7', label: 'Roles in one ecosystem' },
  { value: '0', label: 'Lost charts between visits' },
] as const;

export const featureCards = [
  {
    id: 'lifetime',
    title: 'A record that outlives any visit',
    body: 'Every encounter, lab, fill, and authorization becomes a signed event on one chronological timeline.',
    icon: 'timeline',
  },
  {
    id: 'verify',
    title: 'Source-verified, not self-reported',
    body: 'Hospitals, labs, and pharmacies attest what they issue. Patients control who may read it.',
    icon: 'shield',
  },
  {
    id: 'consent',
    title: 'Consent that is actually usable',
    body: 'Grant access for a visit, a referral, or a claim — then watch it expire. No blanket portal passwords.',
    icon: 'key',
  },
  {
    id: 'interop',
    title: 'Built for every care setting',
    body: 'Patients, clinicians, hospitals, laboratories, pharmacies, and insurers share one vocabulary of events.',
    icon: 'network',
  },
  {
    id: 'continuity',
    title: 'Handoffs without the fax machine',
    body: 'When care changes hands, the next team inherits a verified summary — not a manila folder.',
    icon: 'swap',
  },
  {
    id: 'privacy',
    title: 'Privacy by construction',
    body: 'Least-privilege roles, field-level redaction, and an audit log that cannot be edited after the fact.',
    icon: 'lock',
  },
] as const;

export const whyPoints = [
  {
    title: 'Healthcare is still a stack of portals',
    body: 'Patients juggle logins. Clinicians reconstruct history from memory. Labs email PDFs. Insurers wait on faxes. The record fragments the moment someone changes cities or systems.',
  },
  {
    title: 'WellNest treats the person as the system of record',
    body: 'Instead of another EHR, WellNest is the verified layer above them. Organizations issue events. People carry the history. Access is consented, timed, and attributable.',
  },
  {
    title: 'Trust is a product decision',
    body: 'We designed for private hospitals and national programs alike: calm interfaces, explicit provenance, and no dark patterns around data.',
  },
] as const;

export const steps = [
  {
    n: '01',
    title: 'Create your identity',
    body: 'Patients enroll once. Organizations are credentialed. Every actor in the ecosystem is known.',
  },
  {
    n: '02',
    title: 'Issue verified events',
    body: 'A visit, a panel, a fill, an authorization — each is signed by the organization that created it.',
  },
  {
    n: '03',
    title: 'Consent, then share',
    body: 'The next clinician or plan requests access. The patient (or policy) grants a precise window.',
  },
  {
    n: '04',
    title: 'Carry it for life',
    body: 'Decades later the timeline is still readable, still attributable, still yours.',
  },
] as const;

export const benefitGroups = [
  {
    title: 'For people',
    items: ['One timeline across every clinic', 'No more repeating your history', 'Visible consent and access log'],
  },
  {
    title: 'For clinicians',
    items: ['Context before the consult', 'Signed labs and meds in one view', 'Cleaner referrals and handoffs'],
  },
  {
    title: 'For organizations',
    items: ['Attested issuance, not uploads', 'Fewer duplicate tests', 'Audit-ready sharing'],
  },
] as const;

export const securityPillars = [
  {
    title: 'Encryption in transit and at rest',
    body: 'Modern TLS, envelope encryption, and key separation between tenants and environments.',
  },
  {
    title: 'Least-privilege roles',
    body: 'Seven role families, scoped to organization and purpose. Administrators never browse charts.',
  },
  {
    title: 'Immutable audit',
    body: 'Every read, write, and consent decision is recorded. Logs are append-only.',
  },
  {
    title: 'Designed toward HIPAA & GDPR',
    body: 'Data minimization, purpose limitation, and regional residency controls are first-class.',
  },
] as const;

export const trustedOrgs = [
  'Northline Medical',
  'Harbor & Vale',
  'Cinder Labs',
  'Aurelia Pharmacy',
  'Solace Health Plan',
  'Meridian Hospitals',
] as const;

export const testimonials: Testimonial[] = [
  {
    quote:
      'For the first time I walked into a new city hospital and the attending already had my allergies, last CBC, and discharge note — because I consented, not because someone faxed a chart.',
    name: 'Elena Voss',
    role: 'Patient',
    organization: 'Seattle',
    image: '/images/portrait-patient.jpg',
  },
  {
    quote:
      'WellNest does not replace our EHR. It finally gives us a trustworthy layer above it. Consults start with a verified timeline instead of a scavenger hunt.',
    name: 'Dr. Maya Chen',
    role: 'Chief of Internal Medicine',
    organization: 'Northline Medical',
    image: '/images/portrait-dr-chen.jpg',
  },
  {
    quote:
      'Authorization review used to mean waiting on incomplete packets. Source-signed encounters changed our turnaround more than any rules engine we bought.',
    name: 'Amara Ibekwe',
    role: 'Head of Clinical Operations',
    organization: 'Solace Health Plan',
    image: '/images/portrait-amara.jpg',
  },
];

export const faqs: FaqItem[] = [
  {
    question: 'Is WellNest another electronic health record?',
    answer:
      'No. WellNest sits above existing EHRs, LIS, and pharmacy systems. Organizations continue to chart where they work. They issue verified events into a lifetime record the patient carries.',
  },
  {
    question: 'Who owns the medical record?',
    answer:
      'The person does. Issuing organizations retain authorship and legal responsibility for what they sign. Patients control consent. Administrators govern the platform, not the chart.',
  },
  {
    question: 'How do you prevent forged results?',
    answer:
      'Only credentialed organizations can issue events. Each event carries organizational attestation, a timestamp, and an immutable audit entry. Patients cannot invent lab values; they can only share what was issued.',
  },
  {
    question: 'Can a clinician see everything?',
    answer:
      'Only what the patient (or a lawful policy) consents to, for a defined window. Emergency break-glass is logged, reviewed, and scoped.',
  },
  {
    question: 'Is this ready for production clinical use?',
    answer:
      'Phase 1 is the product foundation and public site. Clinical workflows, identity, and infrastructure land in later phases. We are building toward production, not a demo.',
  },
  {
    question: 'Which regions will you support?',
    answer:
      'The architecture is multi-tenant and residency-aware. Initial go-to-market focuses on private hospital groups and their affiliated labs, pharmacies, and plans.',
  },
];

