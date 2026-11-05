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
    const [records, appointments, prescriptions, labs, vaccinations] = await Promise.all([
      supabase.from('records').select('id,title,category,date,hospital,summary').eq('patient_id', id),
      supabase.from('appointments').select('id,title,doctor,hospital,date,reason').eq('patient_id', id),
      supabase.from('prescriptions').select('id,medicine,issued,doctor_id,instructions').eq('patient_id', id),
      supabase.from('lab_reports').select('id,test_name,collected_at,lab_user_id').eq('patient_id', id),
      supabase.from('vaccinations').select('id,vaccine_name,administered_at,provider').eq('patient_id', id),
    ]);
    const results = [records, appointments, prescriptions, labs, vaccinations];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    const events = [
      ...(records.data ?? []).map((row) => ({ id: `record:${row.id}`, kind: row.category, title: row.title, date: row.date, organization: row.hospital ?? '', detail: row.summary ?? '', recordId: row.id })),
      ...(appointments.data ?? []).map((row) => ({ id: `appointment:${row.id}`, kind: 'visit', title: row.title, date: row.date, organization: row.hospital ?? '', detail: row.reason ?? '' })),
      ...(prescriptions.data ?? []).map((row) => ({ id: `prescription:${row.id}`, kind: 'prescription', title: row.medicine, date: row.issued, organization: '', detail: row.instructions ?? '' })),
      ...(labs.data ?? []).map((row) => ({ id: `lab:${row.id}`, kind: 'lab', title: row.test_name, date: row.collected_at, organization: '', detail: '' })),
      ...(vaccinations.data ?? []).map((row) => ({ id: `vaccination:${row.id}`, kind: 'vaccination', title: row.vaccine_name, date: row.administered_at, organization: row.provider ?? '', detail: '' })),
    ];
    events.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
    return res.status(200).json(events);
  } catch (err) {
    console.error("[timeline GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Health timeline is unavailable.' });
  }
}
