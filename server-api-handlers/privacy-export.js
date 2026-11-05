import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';
export function createPrivacyExportHandler({db=supabase,authenticate=verifyAuth}={}) {
  return async(req,res)=>{
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    if(req.method==='OPTIONS')return res.status(204).end();
    if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
    const auth=await authenticate(req);
    if(!auth.authenticated)return res.status(auth.status||401).json({error:auth.error||'Sign in to continue.'});
    try {
      const sources=[['profile','profiles','id'],['healthIdentity','health_identities','user_id'],['records','records','patient_id'],['prescriptions','prescriptions','patient_id'],['appointments','appointments','patient_id'],['medications','medications','patient_id'],['vaccinations','vaccinations','patient_id'],['accessGrants','access_grants','patient_user_id'],['accessRequests','access_requests','patient_user_id']];
      const output={exportedAt:new Date().toISOString(),format:'WellNest account export v1',attachments:'This export includes saved record data. Private binary attachments can be requested through Support.'};
      for(const[name,table,column]of sources){
        const rows=[];let offset=0;
        for(;;){const {data,error}=await db.from(table).select('*').eq(column,auth.userId).range(offset,offset+499);if(error)throw error;rows.push(...data);if(data.length<500)break;offset+=500;}
        output[name]=rows;
      }
      res.setHeader('Content-Disposition','attachment; filename="WellNest-account-export.json"');
      return res.status(200).json(output);
    }catch(error){console.error('[privacy export]',error?.code||'unavailable');return res.status(503).json({error:'Your export could not be completed. No partial export was issued.'});}
  };
}
export default createPrivacyExportHandler();
