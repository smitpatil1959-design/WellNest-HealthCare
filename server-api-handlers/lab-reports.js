import supabase from './db-client.js';
import { hasVerifiedRole, verifyAuth } from './auth-guard.js';
import { findActiveGrantById, grantAllowsCategory } from './consent.js';
import { getActiveMembership } from './organization-context.js';

const labReportResponseColumns = 'id,test_name,result,status,collected_at,released_at,created_at';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  try {
    let patientId;

    if (auth.role === 'patient') {
      if (req.query?.grantId) return res.status(403).json({ success: false, error: 'Patients may only read their own lab reports.' });
      patientId = auth.userId;
    } else if (auth.role === 'doctor') {
      if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'Verified Doctor account required.' });
      const docContext = await getActiveMembership(auth, ['doctor']);
      if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
      const grantId = typeof req.query?.grantId === 'string' ? req.query.grantId : '';
      if (!grantId || req.query?.patientUserId) return res.status(400).json({ success: false, error: 'A valid access grant reference is required.' });

      const grant = await findActiveGrantById(grantId, auth.userId);
      if (!grant || !grantAllowsCategory(grant, 'lab_report')) {
        return res.status(403).json({ success: false, error: 'An active lab/report consent grant is required.' });
      }
      patientId = grant.patient_user_id;
    } else {
      return res.status(403).json({ success: false, error: 'Patient or verified doctor account required.' });
    }

    const { data, error } = await supabase
      .from('lab_reports')
      .select(labReportResponseColumns)
      .eq('patient_id', patientId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error("[lab-reports GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Lab report storage is unavailable.' });
  }
}
