import supabase from '../db-client.js';
import { verifyAuth, hasVerifiedRole } from '../auth-guard.js';
export default async function handler(req,res) {
  res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const auth=await verifyAuth(req);
  if(!auth.authenticated) return res.status(auth.status||401).json({error:'Sign in to continue.'});
  if(!hasVerifiedRole(auth,['administrator'])) return res.status(403).json({error:'Verified administrator required.'});
  const services=await Promise.all([['Accounts','profiles'],['Organizations','organizations'],['Hospital workflows','hospital_entries'],['Pharmacy inventory','pharmacy_inventory'],['Patient records','records'],['Audit events','audit_events'],['Notifications','app_notifications']].map(async([name,table])=>{
    const start=performance.now();
    try { const {error}=await supabase.from(table).select('id',{head:true,count:'exact'}); return {name,status:error?'down':'operational',latency:`${Math.round(performance.now()-start)} ms`}; }
    catch {return {name,status:'down',latency:'Unavailable'};}
  }));
  return res.status(200).json({checkedAt:new Date().toISOString(),services});
}
