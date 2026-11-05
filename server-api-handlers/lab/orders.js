import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { getLabContext, auditLab } from './context.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

const orderColumns = 'id,organization_id,patient_user_id,ordering_user_id,accession_number,test_kind,test_name,priority,status,doctor_name,hospital_name,requested_at,collected_at,resulted_at,created_at,updated_at';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });

  try {
    const context = await getLabContext(auth);
    if (!context) return res.status(403).json({ success: false, error: 'Active verified laboratory membership required.' });

    if (req.method === 'GET') {
      let query = supabase.from('lab_orders').select(orderColumns)
        .eq('organization_id', context.organization.id).order('requested_at', { ascending: false }).limit(100);
      if (typeof req.query?.status === 'string' && req.query.status) query = query.eq('status', req.query.status);
      if (typeof req.query?.accession === 'string' && req.query.accession) query = query.ilike('accession_number', `%${req.query.accession}%`);
      const { data, error } = await query;
      if (error) throw error;
      await auditLab(auth, 'lab_orders_viewed', 'lab_order', null, context.organization.id);
      return res.status(200).json(data ?? []);
    }

    if (!['laboratory_admin', 'laboratory_director', 'laboratory_technologist'].includes(context.membership.role)) {
      return res.status(403).json({ success: false, error: 'Laboratory order creation requires an authorized staff role.' });
    }
    const body = req.body || {};
    const healthId = typeof body.healthId === 'string' ? body.healthId.trim().toUpperCase() : '';
    const requiredText = ['accessionNumber', 'testKind', 'testName'];
    if (!/^[A-Z0-9-]{4,24}$/.test(healthId) || requiredText.some((key) => typeof body[key] !== 'string' || !body[key].trim())) {
      return res.status(400).json({ success: false, error: 'healthId, accessionNumber, testKind and testName are required.' });
    }
    if (!['routine', 'stat', 'critical'].includes(body.priority || 'routine')) return res.status(400).json({ success: false, error: 'Invalid priority.' });
    const { data: identity, error: identityError } = await supabase.from('health_identities')
      .select('user_id').eq('health_id', healthId).maybeSingle();
    if (identityError) throw identityError;
    if (!identity) return res.status(404).json({ success: false, error: 'Patient Health ID was not found.' });

    const { data, error } = await supabase.from('lab_orders').insert({
      organization_id: context.organization.id,
      patient_user_id: identity.user_id,
      ordering_user_id: auth.userId,
      accession_number: body.accessionNumber.trim(),
      test_kind: body.testKind.trim(),
      test_name: body.testName.trim(),
      priority: body.priority || 'routine',
      status: 'requested',
      doctor_name: typeof body.doctorName === 'string' ? body.doctorName.trim() : '',
      hospital_name: typeof body.hospitalName === 'string' ? body.hospitalName.trim() : '',
    }).select(orderColumns).single();
    if (error) throw error;
    await auditLab(auth, 'lab_order_created', 'lab_order', data.id, context.organization.id);
    return res.status(201).json(data);
  } catch (error) {
    console.error("[lab orders error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory order service is unavailable.' });
  }
}
