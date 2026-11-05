import supabase from './db-client.js';
import {recordSource} from '../shared/record-source.js';
import { hasVerifiedRole, verifyAuth } from './auth-guard.js';
import { findActiveGrant, grantAllowsCategory } from './consent.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });

    if (req.method === 'POST') {
      if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Only patients can share their reports.' });
      const { recordId, grantId } = req.body || {};
      if (!recordId || !grantId) return res.status(400).json({ success: false, error: 'recordId and grantId are required.' });

      const [{ data: record, error: recordError }, { data: candidate, error: grantError }] = await Promise.all([
        supabase.from('records').select('id,patient_id,category').eq('id', recordId).eq('patient_id', auth.userId).maybeSingle(),
        supabase.from('access_grants').select('id,patient_user_id,requester_id').eq('id', grantId).eq('patient_user_id', auth.userId).eq('status', 'active').maybeSingle(),
      ]);
      if (recordError) throw recordError;
      if (grantError) throw grantError;
      if (!record) return res.status(404).json({ success: false, error: 'Report not found.' });
      const grant = candidate?.requester_id ? await findActiveGrant(auth.userId, candidate.requester_id, grantId) : null;
      if (grant && String(grant.id) !== String(grantId)) return res.status(403).json({ success: false, error: 'Choose a currently active access grant.' });
      if (!grant) return res.status(403).json({ success: false, error: 'Choose an active access grant.' });
      if (!grantAllowsCategory(grant, record.category)) return res.status(403).json({ success: false, error: 'This consent does not include the report category.' });

      const shareExpiry = Date.now() + 24 * 60 * 60 * 1000;
      const consentExpiry = grant.expires_at ? new Date(grant.expires_at).getTime() : Number.POSITIVE_INFINITY;
      const expiresAt = new Date(Math.min(shareExpiry, consentExpiry)).toISOString();
      const { data, error } = await supabase.from('record_shares').insert({
        record_id: record.id,
        patient_id: auth.userId,
        recipient_id: candidate.requester_id,
        grant_id: grant.id,
        expires_at: expiresAt,
      }).select('id,expires_at').single();
      if (error) throw error;
      return res.status(201).json({ success: true, shareId: data.id, expiresAt: data.expires_at });
    }

    if (req.method === 'GET') {
      if (!hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])) {
        return res.status(403).json({ success: false, error: 'A verified care organization account is required to open a shared report.' });
      }
      const shareId = String(req.query?.shareId || '');
      if (!shareId) return res.status(400).json({ success: false, error: 'shareId is required.' });
      const { data: share, error: shareError } = await supabase.from('record_shares')
        .select('id,record_id,patient_id,recipient_id,grant_id,expires_at,revoked_at')
        .eq('id', shareId).eq('recipient_id', auth.userId).is('revoked_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
      if (shareError) throw shareError;
      if (!share) return res.status(404).json({ success: false, error: 'This report share is unavailable or expired.' });

      const [{ data: record, error: recordError }] = await Promise.all([
        supabase.from('records').select('id,title,category,status,date,hospital,doctor,laboratory,summary,source,created_by').eq('id', share.record_id).eq('patient_id', share.patient_id).maybeSingle(),
      ]);
      if (recordError) throw recordError;
      const currentGrant = await findActiveGrant(share.patient_id, auth.userId, share.grant_id);
      if (!currentGrant || String(currentGrant.id) !== String(share.grant_id) || !record || !grantAllowsCategory(currentGrant, record.category)) {
        return res.status(403).json({ success: false, error: 'Current patient consent does not authorize this report.' });
      }
      return res.status(200).json({ success: true, record: {...record,source:recordSource(record)} });
    }

    if (req.method === 'DELETE') {
      if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Only patients can revoke a report share.' });
      const { shareId } = req.body || {};
      if (!shareId) return res.status(400).json({ success: false, error: 'shareId is required.' });
      const { data, error } = await supabase.from('record_shares').update({ revoked_at: new Date().toISOString() })
        .eq('id', shareId).eq('patient_id', auth.userId).is('revoked_at', null).select('id').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Active report share not found.' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error("[record-share error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Secure report sharing is unavailable.' });
  }
}
