import {providerConfiguration,createDeliveryProvider} from './providers.js';

export async function processDeliveryJobs({db,env=process.env,send=createDeliveryProvider({env})}) {
  const configured=providerConfiguration(env);
  if(!configured.enabled)return {enabled:false,processed:0,reason:'Delivery is not activated.'};
  const channels=['email','sms'].filter(channel=>configured[channel]);
  if(!channels.length)return {enabled:true,processed:0,reason:'Delivery providers are not configured.'};
  const queued=await db.rpc('queue_appointment_reminders');if(queued.error)throw queued.error;
  const summary={enabled:true,processed:0,accepted:0,skipped:0,failed:0,uncertain:0};
  const publicUrl=env.PUBLIC_APP_URL||'https://wellnest-healthcare.vercel.app';
  if(new URL(publicUrl).protocol!=='https:')throw new Error('A secure public app URL is required');
  for(const channel of channels){
    const claimed=await db.rpc('claim_delivery_jobs',{p_limit:10,p_channel:channel});if(claimed.error)throw claimed.error;
    const jobs=Array.isArray(claimed.data)?claimed.data:claimed.data?[claimed.data]:[];
    for(let start=0;start<jobs.length;start+=5)await Promise.all(jobs.slice(start,start+5).map(async job=>{
      let outcome={status:'skipped',error:'delivery_not_authorized'};
      try{
        const preferences=await db.from('notification_preferences').select('email,sms').eq('user_id',job.recipient_id).maybeSingle();
        const profile=await db.from('profiles').select('account_status').eq('id',job.recipient_id).maybeSingle();
        if(preferences.error||profile.error)throw new Error('Recipient settings unavailable');
        const userResult=await db.auth.admin.getUserById(job.recipient_id);if(userResult.error)throw userResult.error;
        const user=userResult.data.user;
        let current=true;
        if(job.kind==='appointment_reminder'){
          const match=job.reference.match(/^appointment:([a-fA-F0-9-]{36}):(.+)$/);
          const appointment=match?await db.from('appointments').select('status,starts_at').eq('id',match[1]).eq('patient_id',job.recipient_id).maybeSingle():{data:null};
          if(appointment.error)throw appointment.error;
          current=Boolean(appointment.data?.status==='upcoming'&&Date.parse(appointment.data.starts_at)>Date.now()&&Date.parse(appointment.data.starts_at)===Date.parse(match[2]));
        }
        const to=channel==='email'&&user?.email_confirmed_at?user.email:channel==='sms'&&user?.phone_confirmed_at?user.phone:null;
        if(current&&preferences.data?.[channel]===true&&profile.data?.account_status==='active'&&to){
          const text=job.kind==='appointment_reminder'?`A WellNest appointment reminder is ready. Sign in to review it: ${publicUrl}/app`:`You have an update in WellNest. Sign in to review it: ${publicUrl}/app`;
          outcome=await send({channel,to,id:job.id,text});
        }
      }catch{outcome={status:'retry',error:'recipient_check_unavailable'};}
      let status=outcome.status;
      if(status==='not_configured'||status==='retry')status=job.attempt<3?'pending':'failed';
      const result=await db.from('delivery_jobs').update({status,provider_id:outcome.providerId||null,last_error:outcome.error||null,lease_until:null,updated_at:new Date().toISOString(),...(status==='pending'?{due_at:new Date(Date.now()+60000*job.attempt).toISOString()}:{})}).eq('id',job.id).eq('status','processing');
      if(result.error)throw result.error;
      summary.processed++;if(status in summary)summary[status]++;
    }));
  }
  return summary;
}
