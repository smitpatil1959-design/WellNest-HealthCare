import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { findActiveGrant, grantAllowsCategory } from '../consent.js';
import { getActiveMembership } from '../organization-context.js';
import { writeAudit } from '../organization-context.js';

const pharmacistRoles = ['pharmacy_admin', 'pharmacist'];
const responseColumns = 'id,patient_id,doctor_id,medicine,dosage,duration,instructions,refills_left,active,issued,created_at';
const eventColumns = 'id,prescription_id,organization_id,patient_user_id,verification_status,dispensing_status,verified_by,verified_at,rejection_reason,filled_at,picked_up_at,created_at,updated_at';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

async function pharmacyContext(auth) {
  if (!hasVerifiedRole(auth, ['pharmacy'])) return null;
  return getActiveMembership(auth, ['pharmacy_admin', 'pharmacist', 'pharmacy_technician', 'pharmacy_cashier']);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  try {
    const context = await pharmacyContext(auth);
    if (!context) return res.status(403).json({ success: false, error: 'Active verified pharmacy membership required.' });

    if (req.method === 'GET') {
      const { data: grants, error: grantError } = await supabase.from('access_grants')
        .select('id,patient_user_id,categories,expires_at').eq('requester_id', auth.userId).eq('status', 'active').is('revoked_at', null);
      if (grantError) throw grantError;
      const patientIds = (grants || []).filter((grant) => grantAllowsCategory(grant, 'prescription')).map((grant) => grant.patient_user_id);
      if (!patientIds.length) return res.status(200).json([]);
      const { data: prescriptions, error } = await supabase.from('prescriptions').select(responseColumns)
        .in('patient_id', patientIds).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const { data: events, error: eventError } = await supabase.from('pharmacy_prescription_events')
        .select('id,prescription_id,organization_id,patient_user_id,verification_status,dispensing_status,verified_by,verified_at,rejection_reason,filled_at,picked_up_at,created_at,updated_at')
        .eq('organization_id', context.organization.id).in('patient_user_id', patientIds);
      if (eventError) throw eventError;
      const eventByPrescription = new Map((events || []).map((event) => [event.prescription_id, event]));
      return res.status(200).json((prescriptions || []).map((prescription) => ({ ...prescription, pharmacy_event: eventByPrescription.get(prescription.id) || null })));
    }

    const prescriptionId = String(req.query?.id || req.body?.prescriptionId || '').trim();
    if (!prescriptionId) return res.status(400).json({ success: false, error: 'Prescription id is required.' });
    const { data: prescription, error: prescriptionError } = await supabase.from('prescriptions').select(responseColumns).eq('id', prescriptionId).maybeSingle();
    if (prescriptionError) throw prescriptionError;
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found.' });
    const grant = await findActiveGrant(prescription.patient_id, auth.userId);
    if (!grant || !grantAllowsCategory(grant, 'prescription')) return res.status(403).json({ success: false, error: 'Active prescription authorization is required.' });
    const event=await supabase.from('pharmacy_prescription_events').select(eventColumns).eq('prescription_id',prescription.id).eq('organization_id',context.organization.id).maybeSingle();
    if(event.error)throw event.error;

    if (req.method === 'POST') {
      if (!pharmacistRoles.includes(context.membership.role)) return res.status(403).json({ success: false, error: 'Pharmacist authorization required.' });
      if(event.data){
        if(['completed','cancelled'].includes(event.data.dispensing_status))return res.status(409).json({error:'A closed prescription cannot be reopened by verification.'});
        if(event.data.verification_status==='verified')return res.status(200).json(event.data);
      }
      const { data, error } = await supabase.from('pharmacy_prescription_events').upsert({
        prescription_id: prescription.id,
        organization_id: context.organization.id,
        patient_user_id: prescription.patient_id,
        verification_status: 'verified',
        dispensing_status: 'processing',
        verified_by: auth.userId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'prescription_id,organization_id' }).select(eventColumns).single();
      if (error) throw error;
      await writeAudit(auth, 'prescription_verified', 'pharmacy_prescription_event', data.id, context.organization.id, 'ok', { prescriptionId });
      return res.status(200).json(data);
    }

    if (!pharmacistRoles.includes(context.membership.role) && context.membership.role !== 'pharmacy_technician') {
      return res.status(403).json({ success: false, error: 'Pharmacy staff authorization required.' });
    }
    const { status } = req.body || {};
    const validStatuses = ['verifying', 'processing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, error: 'Invalid dispensing status.' });
    const transitions={pending:['verifying','cancelled'],verifying:['processing','cancelled'],processing:['ready','cancelled'],ready:['completed','cancelled'],completed:[],cancelled:[]};
    if(!event.data)return res.status(409).json({error:'A pharmacist must verify this prescription first.'});
    if(status===event.data.dispensing_status)return res.status(200).json(event.data);
    if(!transitions[event.data.dispensing_status]?.includes(status))return res.status(409).json({error:'This prescription status change is not permitted.'});
    if(['processing','ready','completed'].includes(status)&&event.data.verification_status!=='verified')return res.status(409).json({error:'Pharmacist verification is required before preparation or completion.'});
    if (status === 'completed' && !pharmacistRoles.includes(context.membership.role)) return res.status(403).json({ success: false, error: 'Pharmacist authorization required to complete dispensing.' });
    const updates = { dispensing_status: status, updated_at: new Date().toISOString() };
    if (status === 'ready' || status === 'completed') updates.filled_at = new Date().toISOString();
    if (status === 'completed') updates.picked_up_at = new Date().toISOString();
    const { data, error } = await supabase.from('pharmacy_prescription_events').update(updates)
      .eq('prescription_id', prescription.id).eq('organization_id', context.organization.id).eq('dispensing_status',event.data.dispensing_status).select(eventColumns).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Pharmacy prescription event not found.' });
    await writeAudit(auth, `prescription_${status}`, 'pharmacy_prescription_event', data.id, context.organization.id, 'ok', { prescriptionId });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[pharmacy prescriptions error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Pharmacy prescription service is unavailable.' });
  }
}
