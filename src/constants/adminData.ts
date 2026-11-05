import type {
  ActivityEvent,
  AdminNotice,
  AuditEntry,
  PlatformOrg,
  PlatformUser,
  SecurityAlert,
  ServiceStatus,
} from '../types/admin';
import { paths } from '../routes/paths';

export const platformUsers: PlatformUser[] = [
  { id: 'u-elena', name: 'Elena Voss', email: 'demo@wellnest.example', role: 'patient', organization: '—', status: 'active', verified: true, created: '2025-11-02', lastActive: '2026-04-08', avatar: '/images/portrait-patient.jpg' },
  { id: 'u-chen', name: 'Dr. Maya Chen', email: 'doctor@wellnest.example', role: 'doctor', organization: 'Northline Medical', status: 'active', verified: true, created: '2025-08-14', lastActive: '2026-04-08', avatar: '/images/portrait-dr-chen.jpg' },
  { id: 'u-north', name: 'Northline Ops', email: 'hospital@wellnest.example', role: 'hospital', organization: 'Northline Medical', status: 'active', verified: true, created: '2025-07-01', lastActive: '2026-04-08', avatar: '/images/hospital-lobby.jpg' },
  { id: 'u-harbor', name: 'Harbor Release', email: 'lab@wellnest.example', role: 'laboratory', organization: 'Harbor Laboratory', status: 'active', verified: true, created: '2025-07-12', lastActive: '2026-04-08', avatar: '/images/laboratory.jpg' },
  { id: 'u-aurelia', name: 'Aurelia PIC', email: 'pharmacy@wellnest.example', role: 'pharmacy', organization: 'Aurelia Pharmacy', status: 'active', verified: true, created: '2025-09-03', lastActive: '2026-04-08', avatar: '/images/pharmacy.jpg' },
  { id: 'u-solace', name: 'Solace Review', email: 'insurance@wellnest.example', role: 'insurance', organization: 'Solace Health Plan', status: 'active', verified: true, created: '2025-10-20', lastActive: '2026-04-08', avatar: '/images/insurance.jpg' },
  { id: 'u-admin', name: 'Platform Operator', email: 'admin@wellnest.example', role: 'administrator', organization: 'WellNest', status: 'active', verified: true, created: '2025-06-01', lastActive: '2026-04-08', avatar: '/images/portrait-exec.jpg' },
  { id: 'u-ellis', name: 'Dr. Noah Ellis', email: 'noah.ellis@northline.health', role: 'doctor', organization: 'Northline Medical', status: 'pending', verified: false, created: '2026-04-06', lastActive: '2026-04-07', avatar: '/images/portrait-exec.jpg' },
  { id: 'u-hold', name: 'Cinder Labs desk', email: 'desk@cinder.lab', role: 'laboratory', organization: 'Cinder Labs', status: 'suspended', verified: false, created: '2026-02-11', lastActive: '2026-03-01', avatar: '/images/laboratory.jpg' },
];

export const platformOrgs: PlatformOrg[] = [
  { id: 'org-north', name: 'Northline Medical', kind: 'hospital', status: 'verified', registration: 'WA-HSP-440218', users: 46, created: '2025-07-01', reviewer: 'Platform Operator', documents: ['License', 'NPI', 'Malpractice'] },
  { id: 'org-harbor', name: 'Harbor Laboratory', kind: 'laboratory', status: 'verified', registration: 'WA-LAB-882014', users: 18, created: '2025-07-12', reviewer: 'Platform Operator', documents: ['CLIA', 'State lab license'] },
  { id: 'org-aurelia', name: 'Aurelia Pharmacy', kind: 'pharmacy', status: 'verified', registration: 'WA-PH-229184', users: 9, created: '2025-09-03', reviewer: 'Platform Operator', documents: ['DEA', 'State pharmacy'] },
  { id: 'org-solace', name: 'Solace Health Plan', kind: 'insurance', status: 'verified', registration: 'NAIC-14722', users: 22, created: '2025-10-20', reviewer: 'Platform Operator', documents: ['NAIC', 'Plan filings'] },
  { id: 'org-cinder', name: 'Cinder Labs', kind: 'laboratory', status: 'under-review', registration: 'OR-LAB-1102', users: 4, created: '2026-03-28', documents: ['CLIA pending'] },
  { id: 'org-vale', name: 'Harbor & Vale', kind: 'hospital', status: 'pending', registration: 'WA-HSP-1188', users: 2, created: '2026-04-05', documents: ['License scan'] },
];

export const activityFeed: ActivityEvent[] = [
  { id: 'act-1', at: '2026-04-08T10:12:00', actor: 'Dr. Maya Chen', role: 'doctor', organization: 'Northline Medical', action: 'Completed consultation', target: 'Elena Voss', result: 'ok' },
  { id: 'act-2', at: '2026-04-08T10:05:00', actor: 'Harbor Release', role: 'laboratory', organization: 'Harbor Laboratory', action: 'Published CMP', target: 'RPT-HL-88401', result: 'ok' },
  { id: 'act-3', at: '2026-04-08T09:40:00', actor: 'Aurelia PIC', role: 'pharmacy', organization: 'Aurelia Pharmacy', action: 'Verified prescription', target: 'RX-884241', result: 'ok' },
  { id: 'act-4', at: '2026-04-08T09:12:00', actor: 'Solace Review', role: 'insurance', organization: 'Solace Health Plan', action: 'Flagged duplicate claim', target: 'CLM-90500', result: 'ok' },
  { id: 'act-5', at: '2026-04-08T08:50:00', actor: 'Cinder Labs desk', role: 'laboratory', organization: 'Cinder Labs', action: 'Attempted publish without verify', target: 'draft-panel', result: 'denied' },
  { id: 'act-6', at: '2026-04-07T16:20:00', actor: 'Platform Operator', role: 'administrator', organization: 'WellNest', action: 'Opened verification packet', target: 'Harbor & Vale', result: 'ok' },
];

export const auditLog: AuditEntry[] = [
  { id: 'aud-1', at: '2026-04-08T10:12:00', actor: 'Dr. Maya Chen', role: 'doctor', organization: 'Northline Medical', action: 'Patient record viewed', record: 'VYR-ELV-04186', result: 'ok' },
  { id: 'aud-2', at: '2026-04-08T10:05:00', actor: 'Harbor Release', role: 'laboratory', organization: 'Harbor Laboratory', action: 'Report verified', record: 'RPT-HL-88401', result: 'ok' },
  { id: 'aud-3', at: '2026-04-08T09:40:00', actor: 'Aurelia PIC', role: 'pharmacy', organization: 'Aurelia Pharmacy', action: 'Prescription created (fill)', record: 'RX-884241', result: 'ok' },
  { id: 'aud-4', at: '2026-04-08T08:22:00', actor: 'Platform Operator', role: 'administrator', organization: 'WellNest', action: 'Permission changed', record: 'role:lab-tech', result: 'ok' },
  { id: 'aud-5', at: '2026-04-07T19:01:00', actor: 'unknown@vpn', role: '—', organization: '—', action: 'Failed login', record: 'admin@wellnest.example', result: 'denied' },
  { id: 'aud-6', at: '2026-04-07T11:14:00', actor: 'Platform Operator', role: 'administrator', organization: 'WellNest', action: 'Account suspended', record: 'desk@cinder.lab', result: 'ok' },
];

export const securityAlerts: SecurityAlert[] = [
  { id: 'sec-1', title: 'Repeated failed admin logins', detail: '5 failures from 198.51.100.22 in 12 minutes.', time: '18 min ago', severity: 'high' },
  { id: 'sec-2', title: 'New admin session', detail: 'Platform Operator · Chrome on macOS.', time: '1 hour ago', severity: 'low' },
  { id: 'sec-3', title: 'Permission change', detail: 'lab-tech write:reports revoked.', time: 'Yesterday', severity: 'medium' },
];

export const services: ServiceStatus[] = [
  { name: 'API gateway', status: 'operational', latency: '42 ms' },
  { name: 'Identity', status: 'operational', latency: '38 ms' },
  { name: 'Database', status: 'operational', latency: '11 ms' },
  { name: 'Object storage', status: 'degraded', latency: '210 ms' },
  { name: 'Notifications', status: 'operational', latency: '64 ms' },
  { name: 'Background jobs', status: 'operational', latency: '—' },
];

export const adminNotices: AdminNotice[] = [
  { id: 'an-1', kind: 'verify', title: 'Harbor & Vale packet waiting', body: 'License scan submitted Apr 5.', time: '22 min ago', href: paths.app.adminVerification },
  { id: 'an-2', kind: 'security', title: 'Failed admin logins', body: 'Review Security Center.', time: '18 min ago', href: paths.app.adminSecurity },
  { id: 'an-3', kind: 'org', title: 'Cinder Labs still under review', body: 'CLIA document incomplete.', time: '2 hours ago', href: paths.app.adminOrganizations },
  { id: 'an-4', kind: 'system', title: 'Storage latency elevated', body: 'Object storage 210 ms p95.', time: 'Today', href: paths.app.adminHealth },
];

export const growthUsers = [120, 148, 166, 190, 214, 238, 261, 284, 310];
export const growthOrgs = [8, 9, 11, 12, 14, 15, 16, 17, 18];
export const reportsUploaded = [40, 52, 48, 61, 70, 66, 74, 81, 78];
