import { randomUUID } from 'node:crypto';
import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getLabContext, auditLab } from '../../context.js';
import { scanUploadedObject, matchesFileType } from '../../../storage/malware-scanner.js';

const BUCKET = 'medical-reports-private';
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth, ['laboratory_admin', 'laboratory_director', 'laboratory_technologist']);
    if (!context) return res.status(403).json({ success: false, error: 'Authorized laboratory upload role required.' });
    const id = String(req.query?.id || '').trim();
    if(req.method==='GET'){
      const version=await supabase.from('lab_report_versions').select('id').eq('id',id).eq('organization_id',context.organization.id).maybeSingle();
      if(version.error)throw version.error;
      if(!version.data)return res.status(404).json({error:'Report not found.'});
      const file=await supabase.from('storage_objects').select('id,mime_type,byte_size,scan_status,scanner_name,scanned_at').eq('lab_report_version_id',id).eq('organization_id',context.organization.id).is('deleted_at',null).maybeSingle();
      if(file.error)throw file.error;
      return res.status(200).json({file:file.data});
    }
    const body = req.body || {};
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const contentBase64 = typeof body.contentBase64 === 'string' ? body.contentBase64 : '';
    if (!id || !ALLOWED_TYPES.has(mimeType) || !fileName || !contentBase64) return res.status(400).json({ success: false, error: 'Report id, approved MIME type, file name and file content are required.' });
    const content = Buffer.from(contentBase64, 'base64');
    if (!content.length || content.length > MAX_BYTES) return res.status(413).json({ success: false, error: 'Report file is empty or exceeds the 3 MB limit.' });
    if (!matchesFileType(content,mimeType)) return res.status(415).json({error:'The file content does not match its declared type.'});
    const { data: version, error: versionError } = await supabase.from('lab_report_versions')
      .select('id,organization_id,patient_user_id,version,status').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (versionError) throw versionError;
    if (!version) return res.status(404).json({ success: false, error: 'Report version not found.' });
    const existing=await supabase.from('storage_objects').select('id').eq('lab_report_version_id',id).is('deleted_at',null).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data)return res.status(409).json({error:'This version already has an attachment. Create a revised report version to attach a replacement.'});
    if (['published', 'superseded'].includes(version.status)) return res.status(409).json({ success: false, error: 'Published or superseded reports cannot receive new files.' });
    const extension = fileName.toLowerCase().match(/\.(pdf|jpe?g|png)$/)?.[1] || '';
    const expectedExtension = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[mimeType];
    if (!extension || (mimeType === 'image/jpeg' ? !['jpg', 'jpeg'].includes(extension) : extension !== expectedExtension)) return res.status(400).json({ success: false, error: 'File extension does not match the approved MIME type.' });
    const safeExtension = expectedExtension;
    const objectKey = `${context.organization.id}/lab-reports/${version.id}/${randomUUID()}.${safeExtension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectKey, content, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const scan = await scanUploadedObject({content,mimeType});
    const { data, error } = await supabase.from('storage_objects').insert({
      bucket: BUCKET,
      object_key: objectKey,
      owner_user_id: auth.userId,
      organization_id: context.organization.id,
      purpose: 'lab_report',
      mime_type: mimeType,
      byte_size: content.length,
      scan_status: scan.status,
      scanned_at: scan.scannedAt,
      scanner_name: scan.scannerName,
      lab_report_version_id: version.id,
    }).select('id,bucket,mime_type,byte_size,created_at').single();
    if (error) throw error;
    await auditLab(auth, 'lab_file_uploaded', 'storage_object', data.id, context.organization.id, { reportVersionId: version.id });
    return res.status(201).json(data);
  } catch (error) {
    console.error("[lab file upload error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Report file upload is unavailable.' });
  }
}
