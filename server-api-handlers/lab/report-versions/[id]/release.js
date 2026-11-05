import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getLabContext, auditLab } from '../../context.js';
import { requireCleanScan } from '../../../storage/malware-scanner.js';

const reportVersionColumns = 'id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth, ['laboratory_admin', 'laboratory_director']);
    if (!context) return res.status(403).json({ success: false, error: 'Laboratory director or administrator authorization required.' });
    const id = String(req.query?.id || '').trim();
    const { data: version, error: versionError } = await supabase.from('lab_report_versions')
      .select('id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical')
      .eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (versionError) throw versionError;
    if (!version || version.status !== 'verified') return res.status(409).json({ success: false, error: 'Only verified reports can be released.' });
    const { data: file, error: fileError } = await supabase.from('storage_objects')
      .select('id,scan_status').eq('lab_report_version_id', version.id).is('deleted_at', null).maybeSingle();
    if (fileError) throw fileError;
    if (file) {
      try {
        requireCleanScan(file.scan_status);
      } catch (scanError) {
        if (scanError?.code === 'FILE_SCAN_PENDING') return res.status(409).json({ success: false, error: 'Report file has not passed malware scanning.' });
        throw scanError;
      }
    }
    const result = await supabase.rpc('release_lab_report',{p_version:version.id,p_actor:auth.userId,p_organization:context.organization.id});
    if(['PT409','40001'].includes(result.error?.code))return res.status(409).json({error:'Report changed or an attachment has not passed scanning. Refresh before release.'});
    if(result.error)throw result.error;
    return res.status(200).json(result.data);
  } catch (error) {
    console.error("[lab report release error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory report release is unavailable.' });
  }
}
