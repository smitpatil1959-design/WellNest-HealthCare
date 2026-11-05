import supabase from './db-client.js';
import { grantAllowsConsentCategory } from '../shared/consent-categories.js';

export { normalizeConsentCategories } from '../shared/consent-categories.js';

export async function findActiveGrant(patientId, requesterId, grantId) {
  const now = new Date().toISOString();
  let query = supabase
    .from('access_grants')
    .select('id, categories, expires_at')
    .eq('patient_user_id', patientId)
    .eq('requester_id', requesterId)
    .eq('status', 'active')
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`);
  if (grantId !== undefined) query = query.eq('id', grantId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

/** Resolve a Doctor-visible grant reference to its patient only on the server. */
export async function findActiveGrantById(grantId, requesterId) {
  const normalizedId = String(grantId ?? '').trim();
  if (!/^[1-9]\d*$/.test(normalizedId)) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('access_grants')
    .select('id,patient_user_id,categories,expires_at')
    .eq('id', normalizedId)
    .eq('requester_id', requesterId)
    .eq('status', 'active')
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function grantAllowsCategory(grant, category) {
  return grantAllowsConsentCategory(grant, category);
}

export async function authorizedPatientIds(requesterId,category){
  const {data,error}=await supabase.from('access_grants').select('patient_user_id,categories,expires_at').eq('requester_id',requesterId).eq('status','active').is('revoked_at',null).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if(error)throw error;
  return [...new Set((data||[]).filter(grant=>grantAllowsCategory(grant,category)).map(grant=>grant.patient_user_id))];
}
