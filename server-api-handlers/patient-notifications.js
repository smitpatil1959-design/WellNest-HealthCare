import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Patient account required.' });

  const id = auth.userId;
  try {
    const [requests, reports, appointments, prescriptions] = await Promise.all([
      supabase.from('access_requests').select('id,requester_name,organization,purpose,created_at,status').eq('patient_user_id', id).order('created_at', { ascending: false }).limit(30),
      supabase.from('lab_reports').select('id,test_name,released_at,status').eq('patient_id', id).not('released_at', 'is', null).order('released_at', { ascending: false }).limit(30),
      supabase.from('appointments').select('id,title,date,status').eq('patient_id', id).order('date', { ascending: false }).limit(30),
      supabase.from('prescriptions').select('id,medicine,issued').eq('patient_id', id).order('issued', { ascending: false }).limit(30),
    ]);
    const results = [requests, reports, appointments, prescriptions];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    const notices = [
      ...(requests.data ?? []).map((row) => ({ id: `request:${row.id}`, kind: 'consent', title: row.status === 'pending' ? 'Access request needs your decision' : `Access request ${row.status}`, body: `${row.requester_name} · ${row.purpose || 'Care'}`, time: row.created_at, href: '/app/patient/requests' })),
      ...(reports.data ?? []).map((row) => ({ id: `report:${row.id}`, kind: 'report', title: 'Lab report released', body: row.test_name, time: row.released_at, href: '/app/patient/labs' })),
      ...(appointments.data ?? []).map((row) => ({ id: `appointment:${row.id}`, kind: 'appointment', title: row.title, body: `Appointment ${row.status}`, time: row.date, href: '/app/patient/appointments' })),
      ...(prescriptions.data ?? []).map((row) => ({ id: `prescription:${row.id}`, kind: 'medication', title: 'Prescription issued', body: row.medicine, time: row.issued, href: '/app/patient/prescriptions' })),
    ];
    notices.sort((a, b) => String(b.time ?? '').localeCompare(String(a.time ?? '')));
    return res.status(200).json(notices);
  } catch (err) {
    console.error("[patient-notifications GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Patient notifications are unavailable.' });
  }
}
