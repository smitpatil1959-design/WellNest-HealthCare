import {randomUUID} from 'node:crypto';
import supabase from '../db-client.js';
import {verifyAuth,hasVerifiedRole} from '../auth-guard.js';
import {providerConfiguration,createDeliveryProvider} from '../delivery/providers.js';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(204).end();
  const auth=await verifyAuth(req);if(!auth.authenticated)return res.status(auth.status||401).json({error:auth.error||'Sign in to continue.'});
  if(!hasVerifiedRole(auth,['administrator']))return res.status(403).json({error:'Verified administrator required.'});
  if(req.method==='GET'){
    const jobs=await supabase.from('delivery_jobs').select('id,channel,kind,status,attempt,last_error,created_at,updated_at').order('created_at',{ascending:false}).limit(100);
    if(jobs.error)return res.status(503).json({error:'Delivery queue unavailable.'});
    return res.status(200).json({...providerConfiguration(),scanner:Boolean(process.env.SCAN_SERVICE_URL&&process.env.SCAN_API_TOKEN),scheduler:Boolean(process.env.CRON_SECRET),jobs:jobs.data||[]});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const channel=req.body?.channel;if(!['email','sms'].includes(channel))return res.status(400).json({error:'Choose email or SMS.'});
  const user=auth.user;const to=channel==='email'&&user.email_confirmed_at?user.email:channel==='sms'&&user.phone_confirmed_at?user.phone:null;
  if(!to)return res.status(400).json({error:'Verify this account’s email or phone before testing that channel.'});
  const result=await createDeliveryProvider()({channel,to,id:randomUUID(),text:'This is a WellNest delivery setup test requested from your administrator account.'});
  if(result.status!=='accepted')return res.status(503).json({error:result.status==='not_configured'?'Configure the provider and sending identity first.':'Provider acceptance could not be confirmed.'});
  return res.status(200).json({accepted:true,message:'Provider accepted the test. Confirm receipt at your verified address or number.'});
}
