import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { findActiveGrant, grantAllowsCategory } from '../../../consent.js';
import { getLabContext } from '../../context.js';
import { writeAudit } from '../../../organization-context.js';

const SIGNED_URL_SECONDS = 300;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });

  try {
    const id = String(req.query?.id || '').trim();
    if (!id) return res.status(400).json({ success: false, error: 'Report version id is required.' });
    const { data: version, error: versionError } = await supabase.from('lab_report_versions')
      .select('id,organization_id,patient_user_id,status').eq('id', id).maybeSingle();
    if (versionError) throw versionError;
    if (!version || version.status !== 'published') return res.status(404).json({ success: false, error: 'Published report file is unavailable.' });

    let organizationId = null;
    let authorized = false;
    if (auth.role === 'patient' && version.patient_user_id === auth.userId) {
      authorized = true;
    } else if (hasVerifiedRole(auth, ['laboratory'])) {
      const context = await getLabContext(auth);
      authorized = Boolean(context?.organization.id === version.organization_id);
      organizationId = context?.organization.id || null;
    } else if (hasVerifiedRole(auth, ['doctor'])) {
      const grant = await findActiveGrant(version.patient_user_id, auth.userId);
      authorized = Boolean(grant && grantAllowsCategory(grant, 'lab_report'));
    }
    if (!authorized) return res.status(403).json({ success: false, error: 'Current authorization does not permit this report download.' });

    const { data: object, error: objectError } = await supabase.from('storage_objects')
      .select('id,bucket,object_key,mime_type,byte_size,scan_status').eq('lab_report_version_id', id).is('deleted_at', null).maybeSingle();
    if (objectError) throw objectError;
    if (!object) return res.status(404).json({ success: false, error: 'No original report file is available.' });
    if(object.scan_status!=='clean')return res.status(409).json({error:'This attachment has not passed malware scanning.'});
    const { data: signed, error: signedError } = await supabase.storage.from(object.bucket).createSignedUrl(object.object_key, SIGNED_URL_SECONDS);
    if (signedError) throw signedError;
    await writeAudit(auth, 'lab_file_downloaded', 'storage_object', object.id, organizationId || version.organization_id, 'ok', { reportVersionId: id });
    return res.status(200).json({ success: true, url: signed.signedUrl, expiresIn: SIGNED_URL_SECONDS, mimeType: object.mime_type, byteSize: object.byte_size });
  } catch (error) {
    console.error("[lab file download error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Report file download is unavailable.' });
  }
}
