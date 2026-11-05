import supabase from './db-client.js';
import { hasVerifiedRole, verifyAuth } from './auth-guard.js';
import { findActiveGrant, findActiveGrantById, grantAllowsCategory } from './consent.js';
import { getActiveMembership } from './organization-context.js';
import {recordSource} from '../shared/record-source.js';

const recordResponseColumns = 'id,title,category,status,hospital,doctor,laboratory,summary,date,created_at,source,created_by';
const PROVIDER_ROLES = ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'];

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

  if (req.method === 'GET') {
    try {
      const requestedPatientId = typeof req.query?.patientUserId === 'string' ? req.query.patientUserId : '';
      const requestedGrantId = typeof req.query?.grantId === 'string' ? req.query.grantId : '';
      const recordId = typeof req.query?.id === 'string' ? req.query.id : '';
      let patientId = userId;
      let authorizedGrant = null;

      if (auth.role === 'doctor') {
        if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'A verified Doctor account is required.' });
        const docContext = await getActiveMembership(auth, ['doctor']);
        if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
        if (!requestedGrantId || requestedPatientId) return res.status(400).json({ success: false, error: 'A valid access grant reference is required.' });
        authorizedGrant = await findActiveGrantById(requestedGrantId, userId);
        if (!authorizedGrant) return res.status(403).json({ success: false, error: 'An active patient authorization is required.' });
        patientId = authorizedGrant.patient_user_id;
      } else if (requestedGrantId) {
        return res.status(403).json({ success: false, error: 'This account cannot use a Doctor access grant.' });
      } else if (requestedPatientId && requestedPatientId !== userId) {
        if (!hasVerifiedRole(auth, PROVIDER_ROLES) && auth.role !== 'administrator') {
          return res.status(403).json({ success: false, error: 'A verified provider account is required.' });
        }
        if (auth.role !== 'administrator') {
          authorizedGrant = await findActiveGrant(requestedPatientId, userId);
          if (!authorizedGrant) return res.status(403).json({ success: false, error: 'Patient authorization is required before reading records.' });
        }
        patientId = requestedPatientId;
      } else if (auth.role !== 'patient' && auth.role !== 'administrator') {
        return res.status(403).json({ success: false, error: 'Patient records require a patient account or an authorized provider grant.' });
      }

      const { data, error } = await supabase
        .from('records')
        .select(recordResponseColumns)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const records = (data ?? []).map(record=>({...record,source:recordSource(record)}));
      if (authorizedGrant) {
        if (recordId) {
          const record = records.find((item) => item.id === recordId);
          if (record && !grantAllowsCategory(authorizedGrant, record.category)) return res.status(403).json({ success: false, error: 'Your consent does not include this record category.' });
          return res.status(200).json(record ?? null);
        }
        return res.status(200).json(records.filter((record) => grantAllowsCategory(authorizedGrant, record.category)));
      }
      return res.status(200).json(recordId ? records.find((record) => record.id === recordId) ?? null : records);
    } catch (err) {
      console.error("[records GET error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Medical record storage is unavailable.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const allowed = ['title', 'category', 'status', 'hospital', 'doctor', 'laboratory', 'summary', 'date'];
      const record = Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, body[key]]));
      let patientId = userId;
      let docContext = null;

      if (auth.role === 'doctor') {
        if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'A verified Doctor account is required.' });
        docContext = await getActiveMembership(auth, ['doctor']);
        if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
        if (!body.grantId || body.patientUserId) return res.status(400).json({ success: false, error: 'A valid access grant reference is required.' });
        const grant = await findActiveGrantById(body.grantId, userId);
        if (!grant || !grantAllowsCategory(grant, String(record.category || 'visit'))) {
          return res.status(403).json({ success: false, error: 'An active consent grant for this record category is required.' });
        }
        patientId = grant.patient_user_id;
        // Source and actor are set below from the verified account, never the body.
      } else if (auth.role !== 'patient') {
        return res.status(403).json({ success: false, error: 'Patient account or verified Doctor with consent required.' });
      }

      if (!record.title || !record.category) return res.status(400).json({ success: false, error: 'Title and category are required.' });
      const { data, error } = await supabase.from('records').insert({
        patient_id: patientId,
        ...record,
        source: auth.role === 'doctor' ? 'verified' : 'uploaded',
        created_by: userId,
        status: auth.role === 'doctor' ? record.status || 'issued' : 'pending',
        doctor: auth.role === 'doctor' ? auth.fullName : record.doctor,
        hospital: auth.role === 'doctor' ? (docContext?.organization?.display_name || auth.organization) : record.hospital,
        created_at: new Date().toISOString(),
      }).select(recordResponseColumns).single();
      if (error) throw error;
      return res.status(201).json({ success: true, record: data });
    } catch (err) {
      console.error("[records POST error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Medical record could not be saved.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
