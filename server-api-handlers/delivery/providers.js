export function providerConfiguration(env=process.env) {
  return {email:Boolean(env.RESEND_API_KEY&&env.EMAIL_FROM),sms:Boolean(env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_FROM),enabled:env.DELIVERY_ENABLED==='true'};
}
export function createDeliveryProvider({env=process.env,fetchImpl=fetch}={}) {
  return async({channel,to,id,text})=>{
    const configured=providerConfiguration(env);
    if(!configured[channel])return {status:'not_configured'};
    try {
      let response;
      if(channel==='email') {
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))return {status:'failed',error:'invalid_recipient'};
        response=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`wellnest-${id}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject:'Your WellNest update',text}),signal:AbortSignal.timeout(12000),redirect:'error'});
      } else if(channel==='sms') {
        if(!/^\+[1-9]\d{7,14}$/.test(to)||!/^AC[a-fA-F0-9]{32}$/.test(env.TWILIO_ACCOUNT_SID))return {status:'failed',error:'invalid_recipient_or_account'};
        response=await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:to,From:env.TWILIO_FROM,Body:text,ValidityPeriod:'3600'}),signal:AbortSignal.timeout(12000),redirect:'error'});
      } else return {status:'failed',error:'invalid_channel'};
      if(!response.ok)return {status:response.status===429?'retry':response.status>=500?'uncertain':'failed',error:`provider_http_${response.status}`};
      const body=await response.json();const providerId=channel==='email'?body.id:body.sid;
      if(typeof providerId!=='string'||!providerId)return {status:'uncertain',error:'provider_receipt_missing'};
      return {status:'accepted',providerId};
    }catch{return {status:'uncertain',error:'provider_response_unknown'};}
  };
}
