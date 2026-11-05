import supabase from './db-client.js';
import { verifyAuth, hasVerifiedRole } from './auth-guard.js';

export function createSupportHandler({ db = supabase, authenticate = verifyAuth } = {}) {
  return async (req,res) => {
    res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
    if(req.method==='OPTIONS')return res.status(204).end();
    if(!['GET','POST','PATCH'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
    // A signed-in user awaiting MFA can request recovery and read only their own tickets.
    const auth=await authenticate(req,{allowMfaPending:true});
    if(!auth.authenticated)return res.status(auth.status||401).json({error:auth.error||'Sign in to continue.'});
    const admin=!auth.mfaPending&&hasVerifiedRole(auth,['administrator']);
    try {
      if(req.method==='GET') {
        let query=db.from('support_tickets').select('id,user_id,category,subject,status,created_at,updated_at').order('updated_at',{ascending:false}).limit(200);
        if(!admin)query=query.eq('user_id',auth.userId);
        const {data,error}=await query; if(error)throw error;
        const id=String(req.query?.id||'');
        if(!id)return res.status(200).json(data||[]);
        const ticket=(data||[]).find(row=>row.id===id);
        if(!ticket)return res.status(404).json({error:'Ticket not found.'});
        const messages=await db.from('support_messages').select('id,author_id,body,created_at').eq('ticket_id',id).order('created_at');
        if(messages.error)throw messages.error;
        return res.status(200).json({ticket,messages:messages.data||[]});
      }
      const {category,subject,body,id,status}=req.body||{};
      if(typeof body!=='string'||!body.trim()||body.length>5000)return res.status(400).json({error:'Enter a message of up to 5,000 characters.'});
      if(req.method==='POST') {
        if(!['support','privacy_export','privacy_deletion','mfa_recovery'].includes(category)||typeof subject!=='string'||!subject.trim()||subject.length>160)return res.status(400).json({error:'Choose a request type and enter a short subject.'});
        const result=await db.rpc('create_support_ticket',{p_user:auth.userId,p_category:category,p_subject:subject.trim(),p_body:body.trim()});
        if(result.error?.code==='P0001')return res.status(429).json({error:'You have several open requests. Reply to an existing request or try again later.'});
        if(result.error)throw result.error;
        return res.status(201).json(result.data);
      }
      if(!id||status&&!['open','in_progress','resolved','closed'].includes(status))return res.status(400).json({error:'Choose a ticket and valid status.'});
      const result=await db.rpc('reply_support_ticket',{p_user:auth.userId,p_ticket:id,p_body:body.trim(),p_status:admin?status||null:null,p_admin:admin});
      if(result.error?.code==='42501')return res.status(403).json({error:'You cannot access this request.'});
      if(result.error)throw result.error;
      return res.status(200).json(result.data);
    }catch(error){console.error('[support]',error?.code||'unavailable');return res.status(503).json({error:'Support requests could not be saved or loaded.'});}
  };
}
export default createSupportHandler();
