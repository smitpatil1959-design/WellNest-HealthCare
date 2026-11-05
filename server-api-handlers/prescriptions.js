import supabase from './db-client.js';
import { hasVerifiedRole, verifyAuth } from './auth-guard.js';
import { findActiveGrantById, grantAllowsCategory } from './consent.js';
import { getActiveMembership } from './organization-context.js';

const prescriptionResponseColumns = 'id,medicine,dosage,duration,instructions,refills_left,active,issued,created_at';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  const userId = auth.userId;

  if (req.method === 'POST') {
    if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'Verified Doctor account required.' });
    const docContext = await getActiveMembership(auth, ['doctor']);
    if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
    const { grantId, patientUserId, lines } = req.body || {};
    if (!grantId || patientUserId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, error: 'An access grant and at least one prescription line are required.' });
    }
    try {
      const grant = await findActiveGrantById(grantId, userId);
      if (!grant || !grantAllowsCategory(grant, 'prescription')) {
        return res.status(403).json({ success: false, error: 'An active prescription consent grant is required.' });
      }
      const rows = lines.map((line) => ({
        patient_id: grant.patient_user_id,
        doctor_id: userId,
        medicine: String(line?.medicine || '').trim(),
        dosage: String(line?.dosage || '').trim(),
        duration: String(line?.duration || '').trim(),
        instructions: String(line?.instructions || '').trim(),
        refills_left: Number.isInteger(line?.refillsLeft) ? Math.max(0, line.refillsLeft) : 0,
        active: true,
      }));
      if (rows.some((row) => !row.medicine || !row.dosage || !row.duration)) {
        return res.status(400).json({ success: false, error: 'Each medicine needs a name, dosage, and duration.' });
      }
      const { data, error } = await supabase.from('prescriptions').insert(rows).select(prescriptionResponseColumns);
      if (error) throw error;
      return res.status(201).json(data ?? []);
    } catch (err) {
      console.error("[prescriptions POST error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Prescription could not be saved.' });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const patientUserId = typeof req.query?.patientUserId === 'string' ? req.query.patientUserId : '';
    const grantId = typeof req.query?.grantId === 'string' ? req.query.grantId : '';
    let query = supabase.from('prescriptions').select(prescriptionResponseColumns).order('created_at', { ascending: false });

    if (auth.role === 'patient') {
      if (grantId || (patientUserId && patientUserId !== userId)) return res.status(403).json({ success: false, error: 'Patients may only read their own prescriptions.' });
      query = query.eq('patient_id', userId);
    } else if (auth.role === 'doctor') {
      if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'Verified Doctor account required.' });
      const docContext = await getActiveMembership(auth, ['doctor']);
      if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
      if (patientUserId) return res.status(400).json({ success: false, error: 'Use the authorized grant reference to select a patient.' });
      if (grantId) {
        const grant = await findActiveGrantById(grantId, userId);
        if (!grant || !grantAllowsCategory(grant, 'prescription')) return res.status(403).json({ success: false, error: 'An active prescription consent grant is required.' });
        // The grant authorizes this patient's history, including prescriptions
        // written by other clinicians. The patient UUID stays server-side.
        query = query.eq('patient_id', grant.patient_user_id);
      } else {
        query = query.eq('doctor_id', userId);
      }
    } else {
      return res.status(403).json({ success: false, error: 'Patient or verified Doctor account required.' });
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error("[prescriptions GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Prescription storage is unavailable.' });
  }
}
