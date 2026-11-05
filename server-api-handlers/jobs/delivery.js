import {timingSafeEqual} from 'node:crypto';
import supabase from '../db-client.js';
import {processDeliveryJobs} from '../delivery/worker.js';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
  const expected=process.env.CRON_SECRET?Buffer.from(`Bearer ${process.env.CRON_SECRET}`):null;const actual=Buffer.from(req.headers?.authorization||'');
  if(!expected||actual.length!==expected.length||!timingSafeEqual(actual,expected))return res.status(401).json({error:'Scheduler authentication required.'});
  try{return res.status(200).json(await processDeliveryJobs({db:supabase}));}catch(error){console.error('[delivery worker]',error?.code||'unavailable');return res.status(503).json({error:'Delivery worker could not complete. No unconfirmed delivery is marked delivered.'});}
}
