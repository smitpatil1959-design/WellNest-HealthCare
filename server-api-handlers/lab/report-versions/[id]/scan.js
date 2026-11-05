import supabase from '../../../db-client.js';
import {verifyAuth,hasVerifiedRole} from '../../../auth-guard.js';
import {getLabContext,auditLab} from '../../context.js';
import {scanUploadedObject} from '../../../storage/malware-scanner.js';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const auth=await verifyAuth(req);if(!auth.authenticated)return res.status(auth.status||401).json({error:auth.error||'Sign in to continue.'});
  if(!hasVerifiedRole(auth,['laboratory']))return res.status(403).json({error:'Verified laboratory account required.'});
  try{
    const context=await getLabContext(auth,['laboratory_admin','laboratory_director','laboratory_pathologist']);
    if(!context)return res.status(403).json({error:'Authorized laboratory verifier required.'});
    const id=String(req.query?.id||'');
    const version=await supabase.from('lab_report_versions').select('id,status').eq('id',id).eq('organization_id',context.organization.id).maybeSingle();
    if(version.error)throw version.error;
    if(!version.data||['published','superseded'].includes(version.data.status))return res.status(409).json({error:'Choose an unpublished report from your laboratory.'});
    const file=await supabase.from('storage_objects').select('id,bucket,object_key,mime_type,scan_status').eq('lab_report_version_id',id).eq('organization_id',context.organization.id).is('deleted_at',null).maybeSingle();
    if(file.error)throw file.error;if(!file.data)return res.status(404).json({error:'Report attachment not found.'});
    if(file.data.scan_status==='quarantined')return res.status(409).json({error:'Quarantined files cannot be cleared by a retry. Upload a corrected file.'});
    const downloaded=await supabase.storage.from(file.data.bucket).download(file.data.object_key);if(downloaded.error)throw downloaded.error;
    const scan=await scanUploadedObject({content:Buffer.from(await downloaded.data.arrayBuffer()),mimeType:file.data.mime_type});
    const updated=await supabase.from('storage_objects').update({scan_status:scan.status,scanner_name:scan.scannerName,scanned_at:scan.scannedAt}).eq('id',file.data.id).eq('organization_id',context.organization.id);
    if(updated.error)throw updated.error;
    await auditLab(auth,'lab_file_rescanned','storage_object',file.data.id,context.organization.id,{scanStatus:scan.status});
    return res.status(200).json({scanStatus:scan.status});
  }catch(error){console.error('[lab scan]',error?.code||'unavailable');return res.status(503).json({error:'File scan could not be completed.'});}
}
