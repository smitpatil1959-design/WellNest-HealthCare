import type { LabNotice, LabOrder, LabOrg, LabReport } from '../types/lab';
import { paths } from '../routes/paths';

export const labOrg: LabOrg = {
  name: 'Harbor Laboratory',
  legalName: 'Harbor Diagnostic Laboratory, LLC',
  registration: 'WA-LAB-882014',
  clia: '50D1234567',
  address: '210 Alaskan Way S, Seattle, WA 98104',
  phone: '+1 (206) 555-0199',
  email: 'release@harborlab.health',
  hours: 'Mon–Sat 06:00–20:00 · STAT 24h',
  verified: true,
  logo: '/images/laboratory.jpg',
  services: ['Chemistry', 'Hematology', 'Pathology', 'ECG', 'X-Ray', 'CT', 'MRI', 'Ultrasound'],
};

export const labOrders: LabOrder[] = [
  { id: 'lo-1', accession: 'HL-24028-01', patientName: 'Elena Voss', patientId: 'VYR-ELV-04186', mrn: 'NL-04186', doctor: 'Dr. Maya Chen', hospital: 'Northline Medical', kind: 'blood', test: 'Lipid panel', status: 'pending', priority: 'routine', requested: '2026-04-02', collected: '2026-04-02' },
  { id: 'lo-2', accession: 'HL-24028-02', patientName: 'Marcus Hale', patientId: 'VYR-MHA-22910', mrn: 'NL-22910', doctor: 'Dr. Maya Chen', hospital: 'Northline Medical', kind: 'blood', test: 'HbA1c', status: 'awaiting-verify', priority: 'routine', requested: '2026-03-18', collected: '2026-03-18', resulted: '2026-03-18' },
  { id: 'lo-3', accession: 'HL-24028-03', patientName: 'Sofia Lind', patientId: 'VYR-SLI-55019', mrn: 'NL-55019', doctor: 'Dr. James Okonkwo', hospital: 'Northline Medical', kind: 'ecg', test: '12-lead ECG', status: 'in-progress', priority: 'stat', requested: '2026-04-08' },
  { id: 'lo-4', accession: 'HL-24028-04', patientName: 'Elena Voss', patientId: 'VYR-ELV-04186', mrn: 'NL-04186', doctor: 'Dr. Maya Chen', hospital: 'Northline Medical', kind: 'blood', test: 'CMP', status: 'published', priority: 'routine', requested: '2026-03-26', collected: '2026-03-26', resulted: '2026-03-28' },
  { id: 'lo-5', accession: 'HL-24028-05', patientName: 'Priya Nair', patientId: 'VYR-PNA-11844', mrn: 'NL-11844', doctor: 'Dr. Amira Reyes', hospital: 'Harbor & Vale', kind: 'mri', test: 'MRI brain', status: 'requested', priority: 'routine', requested: '2026-04-08' },
  { id: 'lo-6', accession: 'HL-24028-06', patientName: 'Jonah Park', patientId: 'VYR-JPA-77301', mrn: 'NL-77301', doctor: 'Dr. Maya Chen', hospital: 'Northline Medical', kind: 'urine', test: 'Urinalysis', status: 'resulted', priority: 'routine', requested: '2026-04-07', collected: '2026-04-07', resulted: '2026-04-08' },
  { id: 'lo-7', accession: 'HL-24028-07', patientName: 'Sofia Lind', patientId: 'VYR-SLI-55019', mrn: 'NL-55019', doctor: 'Dr. James Okonkwo', hospital: 'Northline Medical', kind: 'blood', test: 'Troponin I', status: 'awaiting-verify', priority: 'critical', requested: '2026-04-08', collected: '2026-04-08', resulted: '2026-04-08' },
  { id: 'lo-8', accession: 'HL-24028-08', patientName: 'Marcus Hale', patientId: 'VYR-MHA-22910', mrn: 'NL-22910', doctor: 'Dr. Maya Chen', hospital: 'Northline Medical', kind: 'xray', test: 'Chest X-ray', status: 'in-progress', priority: 'stat', requested: '2026-04-08' },
  { id: 'lo-9', accession: 'HL-24028-09', patientName: 'Elena Voss', patientId: 'VYR-ELV-04186', mrn: 'NL-04186', doctor: 'Dr. James Okonkwo', hospital: 'Meridian Hospitals', kind: 'ultrasound', test: 'Carotid duplex', status: 'requested', priority: 'routine', requested: '2026-04-08' },
  { id: 'lo-10', accession: 'HL-24028-10', patientName: 'Priya Nair', patientId: 'VYR-PNA-11844', mrn: 'NL-11844', doctor: 'Dr. Amira Reyes', hospital: 'Harbor & Vale', kind: 'pathology', test: 'Skin biopsy', status: 'pending', priority: 'routine', requested: '2026-04-06' },
];

export const labReports: LabReport[] = [
  {
    id: 'lrpt-1',
    reportId: 'RPT-HL-88401',
    orderId: 'lo-4',
    version: 1,
    title: 'Comprehensive metabolic panel',
    kind: 'blood',
    patientName: 'Elena Voss',
    patientId: 'VYR-ELV-04186',
    doctor: 'Dr. Maya Chen',
    hospital: 'Northline Medical',
    source: 'laboratory',
    status: 'published',
    verifier: 'Dr. Ruth Adeyemi, MD',
    verifiedAt: '2026-03-28T14:12:00',
    publishedAt: '2026-03-28T14:18:00',
    impression: 'Mild isolated ALT elevation. Remainder within reference.',
    analytes: [
      { name: 'Glucose', value: '92', unit: 'mg/dL', ref: '70–99' },
      { name: 'Creatinine', value: '0.8', unit: 'mg/dL', ref: '0.5–1.1' },
      { name: 'ALT', value: '41', unit: 'U/L', ref: '7–35', flag: 'H' },
      { name: 'Sodium', value: '139', unit: 'mmol/L', ref: '136–145' },
    ],
    history: [
      { at: '2026-03-26T08:00:00', actor: 'Accession desk', action: 'Order received' },
      { at: '2026-03-26T08:22:00', actor: 'Tech. Kim', action: 'Specimen collected' },
      { at: '2026-03-28T13:40:00', actor: 'Analyzer DXC', action: 'Result generated v1' },
      { at: '2026-03-28T14:12:00', actor: 'Dr. Ruth Adeyemi', action: 'Verified v1' },
      { at: '2026-03-28T14:18:00', actor: 'Release service', action: 'Published to patient timeline' },
    ],
    critical: false,
  },
  {
    id: 'lrpt-2',
    reportId: 'RPT-HL-88422',
    orderId: 'lo-2',
    version: 1,
    title: 'HbA1c',
    kind: 'blood',
    patientName: 'Marcus Hale',
    patientId: 'VYR-MHA-22910',
    doctor: 'Dr. Maya Chen',
    hospital: 'Northline Medical',
    source: 'laboratory',
    status: 'awaiting-verify',
    impression: '7.4% — above target. Pending pathologist sign.',
    analytes: [{ name: 'HbA1c', value: '7.4', unit: '%', ref: '<5.7', flag: 'H' }],
    history: [
      { at: '2026-03-18T09:00:00', actor: 'Accession desk', action: 'Order received' },
      { at: '2026-03-18T11:20:00', actor: 'Tech. Ortiz', action: 'Result generated v1' },
    ],
    critical: false,
  },
  {
    id: 'lrpt-3',
    reportId: 'RPT-HL-88490',
    orderId: 'lo-7',
    version: 1,
    title: 'Troponin I',
    kind: 'blood',
    patientName: 'Sofia Lind',
    patientId: 'VYR-SLI-55019',
    doctor: 'Dr. James Okonkwo',
    hospital: 'Northline Medical',
    source: 'laboratory',
    status: 'awaiting-verify',
    impression: 'Critical elevation. Notify attending immediately after verification.',
    analytes: [{ name: 'Troponin I', value: '2.8', unit: 'ng/mL', ref: '<0.04', flag: 'C' }],
    history: [
      { at: '2026-04-08T07:40:00', actor: 'ED accession', action: 'STAT order received' },
      { at: '2026-04-08T08:05:00', actor: 'Tech. Kim', action: 'Result generated v1' },
    ],
    critical: true,
  },
];

export const labNotices: LabNotice[] = [
  { id: 'ln-1', kind: 'critical', title: 'Critical troponin — Sofia Lind', body: 'Awaiting pathologist verification before clinical call.', time: '4 min ago', href: paths.app.labCritical },
  { id: 'ln-2', kind: 'request', title: 'MRI brain requested — Priya Nair', body: 'Dr. Reyes · Harbor & Vale', time: '18 min ago', href: paths.app.labTests },
  { id: 'ln-3', kind: 'verify', title: 'HbA1c ready to sign — Marcus Hale', body: 'Queue for Dr. Adeyemi', time: '1 hour ago', href: paths.app.labVerify },
  { id: 'ln-4', kind: 'publish', title: 'CMP published to Elena Voss', body: 'Patient and Dr. Chen notified.', time: 'Mar 28', href: paths.app.labPublish },
];

export const labVolume = [18, 22, 19, 25, 28, 24, 31, 29, 27];
export const turnaroundHours = [6.2, 5.8, 6.0, 5.4, 4.9, 5.1, 4.7];
