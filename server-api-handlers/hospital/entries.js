import supabase from '../db-client.js';
import { verifyAuth, hasVerifiedRole } from '../auth-guard.js';
import { getActiveMembership } from '../organization-context.js';
import { findActiveGrant, grantAllowsCategory } from '../consent.js';
import { hospitalAccess, canWriteHospital, validateHospitalPayload } from './model.js';

export function createHospitalHandler({ db = supabase, authenticate = verifyAuth, membership = getActiveMembership, findGrant = findActiveGrant } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ error: 'Sign in to continue.' });
    if (!hasVerifiedRole(auth, ['hospital'])) return res.status(403).json({ error: 'Verified hospital account required.' });
    try {
      const context = await membership(auth, Object.keys(hospitalAccess));
      if (!context || context.organization.kind !== 'hospital') return res.status(403).json({ error: 'Active hospital membership required.' });
      const organizationId = context.organization.id;
      const role = context.membership.role;
      if (req.method === 'GET') {
        const { data, error } = await db.from('hospital_entries').select('id,kind,payload,version,updated_at')
          .eq('organization_id', organizationId).in('kind', hospitalAccess[role]).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      const { kind, id, version } = req.body || {};
      if (!canWriteHospital(role, kind)) return res.status(403).json({ error: 'Your hospital role cannot change this entry.' });
      if (req.method === 'PATCH' && (!id || !Number.isSafeInteger(version) || version < 1)) return res.status(400).json({ error: 'The entry and current version are required.' });
      let previous = null;
      if (id) {
        const result = await db.from('hospital_entries').select('id,kind,payload,version').eq('id', id).eq('organization_id', organizationId).maybeSingle();
        if (result.error) throw result.error;
        previous = result.data;
        if (!previous || previous.kind !== kind) return res.status(404).json({ error: 'Hospital entry not found.' });
      }
      let payload;
      try { payload = validateHospitalPayload(kind, req.body.payload); }
      catch (error) { return res.status(400).json({ error: error.message }); }
      if (kind === 'admissions' && payload.status === 'discharged' && previous?.payload.status !== 'discharged') return res.status(400).json({ error: 'Release the discharge summary to close this admission.' });
      if (kind === 'discharges' && previous?.payload.approved) return res.status(409).json({ error: 'Released discharge summaries cannot be edited.' });
      if (kind === 'discharges' && payload.approved && role !== 'hospital_doctor') return res.status(403).json({ error: 'An authorized hospital clinician must release the discharge summary.' });
      if (previous && ['consults', 'reports'].includes(kind)) return res.status(409).json({ error: 'Saved clinical notes cannot be overwritten. Add a new entry for corrections.' });
      // Resolve all relationships within this hospital; browser identifiers never establish access.
      for (const [key, parentKind] of [['patientId', 'patients'], ['doctorId', 'doctors'], ['departmentId', 'departments'], ['admissionId', 'admissions']]) {
        if (!payload[key]) continue;
        const { data: parent, error } = await db.from('hospital_entries').select('payload').eq('id', payload[key]).eq('organization_id', organizationId).eq('kind', parentKind).maybeSingle();
        if (error) throw error;
        if (!parent) return res.status(400).json({ error: `Choose a ${parentKind} entry from your hospital.` });
        if (key === 'admissionId' && parent.payload.patientId !== payload.patientId) return res.status(400).json({ error: 'Admission and patient do not match.' });
      }
      if (kind === 'patients') {
        const { data: matches, error } = await db.from('hospital_entries').select('id,payload').eq('organization_id', organizationId).eq('kind', 'patients').contains('payload', { dob: payload.dob });
        if (error) throw error;
        const duplicate = matches?.find(row => row.id !== id && row.payload.name.toLowerCase() === payload.name.toLowerCase());
        if (duplicate) return res.status(409).json({ error: 'A matching patient chart already exists. Open the existing chart.' });
        if (payload.healthId) {
          const { data: identity, error: identityError } = await db.from('health_identities').select('user_id,health_id').eq('health_id', payload.healthId).maybeSingle();
          if (identityError) throw identityError;
          const grant = identity && await findGrant(identity.user_id, auth.userId);
          if (!identity || !grant || !grantAllowsCategory(grant, 'visit')) return res.status(403).json({ error: 'Ask the patient to authorize clinical history access before linking their Health ID.' });
          payload.patientUserId = identity.user_id;
        }
        payload.mrn = previous?.payload.mrn || `WN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        payload.age = Math.max(0, Math.floor((Date.now() - Date.parse(payload.dob)) / 31557600000));
        payload.lastVisit = new Date().toISOString().slice(0, 10);
      }
      if (['consults', 'reports', 'discharges'].includes(kind)) {
        const { data: chart, error } = await db.from('hospital_entries').select('payload').eq('id', payload.patientId).eq('organization_id', organizationId).eq('kind', 'patients').single();
        if (error) throw error;
        if (chart.payload.patientUserId) {
          const grant = await findGrant(chart.payload.patientUserId, auth.userId);
          if (!grant || !grantAllowsCategory(grant, 'visit')) return res.status(403).json({ error: 'Active patient authorization is required to publish to their health record.' });
          payload.patientUserId = chart.payload.patientUserId;
        }
        payload.uploader = auth.fullName;
        payload.source = 'hospital';
        payload.verified = false;
        payload.updated = new Date().toISOString().slice(0, 10);
      }
      const result = await db.rpc('save_hospital_entry', { p_organization: organizationId, p_actor: auth.userId, p_kind: kind, p_payload: payload, p_id: previous?.id || null, p_version: previous ? version : null });
      if (result.error) {
        if (['PT409', '40001', '23505'].includes(result.error.code)) return res.status(409).json({ error: 'This entry changed or conflicts with another entry. Refresh and try again.' });
        throw result.error;
      }
      return res.status(previous ? 200 : 201).json(result.data);
    } catch (error) {
      console.error('[hospital entries]', error?.code || 'unavailable');
      return res.status(503).json({ error: 'Hospital data could not be saved or loaded. Check the database setup and retry.' });
    }
  };
}
export default createHospitalHandler();
