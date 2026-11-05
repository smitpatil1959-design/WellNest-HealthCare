import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {createTestDatabase} from './helpers/create-test-database.mjs';
import {pgApiAdapter} from './helpers/pg-api-adapter.mjs';
import {processDeliveryJobs} from '../server-api-handlers/delivery/worker.js';

test('calendar, support, delivery queue and local backup recovery',async t=>{
  const pg=await createTestDatabase();t.after(()=>pg.close());const db=pgApiAdapter(pg);
  await t.test('business conflicts use HTTP 409 without changing workflow execution permissions',async()=>{
    const functions=(await pg.query("SELECT p.proname,p.prosrc,p.prosecdef,has_function_privilege('authenticated',p.oid,'EXECUTE') AS browser_execute,has_function_privilege('service_role',p.oid,'EXECUTE') AS server_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('save_hospital_entry','release_lab_report','decide_access_request','manage_doctor_slot','book_appointment_slot')")).rows;
    assert.equal(functions.length,5);
    for(const fn of functions){assert.ok(fn.prosrc.includes("'PT409'"),fn.proname);assert.ok(!fn.prosrc.includes("'40001'"),fn.proname);assert.equal(fn.prosecdef,true);assert.equal(fn.browser_execute,false);assert.equal(fn.server_execute,true);}
  });
  const patient='20000000-0000-4000-8000-000000000001',doctor='20000000-0000-4000-8000-000000000002',other='20000000-0000-4000-8000-000000000003',org='30000000-0000-4000-8000-000000000001';
  await pg.query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,'patient@example.test',now()),($2,'doctor@example.test',now()),($3,'other@example.test',now())",[patient,doctor,other]);
  await pg.query("UPDATE profiles SET role='doctor',role_verified=true WHERE id=$1",[doctor]);
  await pg.query("INSERT INTO organizations(id,kind,legal_name,display_name,status,verified_at) VALUES($1,'hospital','Test Hospital','Test Hospital','verified',now())",[org]);
  await pg.query("INSERT INTO organization_memberships(organization_id,user_id,role,status,verified_at) VALUES($1,$2,'doctor','active',now())",[org,doctor]);
  let slot,appointment;
  await t.test('browser profile reads require AAL2 once an authenticator is verified',async()=>{
    await pg.query("INSERT INTO auth.mfa_factors(user_id,status) VALUES($1,'verified')",[patient]);
    await pg.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[patient]);
    await pg.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:patient,aal:'aal1'})]);
    await pg.exec('SET ROLE authenticated');
    try{
      assert.equal((await pg.query('SELECT id FROM profiles WHERE id=$1',[patient])).rows.length,0);
      await pg.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:patient,aal:'aal2'})]);
      assert.equal((await pg.query('SELECT id FROM profiles WHERE id=$1',[patient])).rows.length,1);
    }finally{await pg.exec('RESET ROLE');}
    await pg.query('DELETE FROM auth.mfa_factors WHERE user_id=$1',[patient]);
  });
  const start=new Date(Date.now()+12*3600000);start.setUTCSeconds(0,0);const end=new Date(start.getTime()+1800000);
  await t.test('doctor availability rejects overlaps and stores the clinic timezone',async()=>{
    slot=(await pg.query('SELECT manage_doctor_slot($1,$2,$3,$4,$5) AS data',[doctor,org,start.toISOString(),end.toISOString(),'Asia/Kolkata'])).rows[0].data;
    assert.equal(slot.timezone,'Asia/Kolkata');
    await assert.rejects(pg.query('SELECT manage_doctor_slot($1,$2,$3,$4,$5)',[doctor,org,new Date(start.getTime()+60000).toISOString(),end.toISOString(),'Asia/Kolkata']),{code:'PT409'});
  });
  await t.test('reservation is unique and failed rescheduling keeps the original booking',async()=>{
    appointment=(await pg.query('SELECT book_appointment_slot($1,$2,$3,$4,$5) AS data',[patient,doctor,slot.id,'TEST visit','Test reason'])).rows[0].data;
    await assert.rejects(pg.query('SELECT book_appointment_slot($1,$2,$3,$4,$5)',[other,doctor,slot.id,'Duplicate','']),{code:'PT409'});
    await assert.rejects(pg.query('SELECT book_appointment_slot($1,$2,$3,$4,$5,$6)',[patient,doctor,other,'Invalid','',''+appointment.id]),{code:'PT409'});
    assert.equal((await pg.query('SELECT slot_id FROM appointments WHERE id=$1',[appointment.id])).rows[0].slot_id,slot.id);
    await assert.rejects(pg.query('SELECT manage_doctor_slot($1,$2,NULL,NULL,$3,$4)',[doctor,org,'UTC',slot.id]),{code:'PT409'});
  });
  await t.test('support request and first message commit together and other users cannot reply',async()=>{
    const ticket=(await pg.query('SELECT create_support_ticket($1,$2,$3,$4) AS data',[patient,'privacy_deletion','TEST request','Test privacy message'])).rows[0].data;
    assert.equal((await pg.query('SELECT count(*)::int AS count FROM support_messages WHERE ticket_id=$1',[ticket.id])).rows[0].count,1);
    await assert.rejects(pg.query('SELECT reply_support_ticket($1,$2,$3,NULL,false)',[other,ticket.id,'Unauthorized']),{code:'42501'});
    await assert.rejects(pg.query('SELECT reply_support_ticket($1,$2,$3,$4,true)',[other,ticket.id,'Forged admin','resolved']),{code:'42501'});
    assert.equal((await pg.query('SELECT status FROM support_tickets WHERE id=$1',[ticket.id])).rows[0].status,'open');
  });
  await t.test('disabled delivery claims no jobs and sends no messages',async()=>{
    let sent=false;const result=await processDeliveryJobs({db,env:{},send:async()=>{sent=true;}});
    assert.equal(result.enabled,false);assert.equal(sent,false);
    assert.equal((await pg.query("SELECT count(*)::int AS count FROM delivery_jobs WHERE status='processing'")).rows[0].count,0);
  });
  const env={DELIVERY_ENABLED:'true',RESEND_API_KEY:'test',EMAIL_FROM:'no-reply@example.test',TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),TWILIO_AUTH_TOKEN:'test',TWILIO_FROM:'+15555550100'};
  await t.test('delivery respects opt-in and verified destinations; messages contain no clinical content',async()=>{
    await pg.query('INSERT INTO notification_preferences(user_id,email,sms,product) VALUES($1,true,false,false) ON CONFLICT(user_id) DO UPDATE SET email=true,sms=false',[patient]);
    await pg.query("INSERT INTO app_notifications(recipient_id,kind,title,body) VALUES($1,'test','Sensitive TEST title','Sensitive TEST body')",[patient]);
    const sent=[];await processDeliveryJobs({db,env,send:async message=>{sent.push(message);return {status:'accepted',providerId:'test-receipt'};}});
    assert.ok(sent.length>0);assert.ok(sent.every(message=>message.channel==='email'&&message.to==='patient@example.test'&&!message.text.includes('Sensitive')&&!message.text.includes('Test reason')));
    assert.ok((await pg.query("SELECT id FROM delivery_jobs WHERE recipient_id=$1 AND channel='sms' AND status='skipped'",[patient])).rows.length>0);
    assert.equal((await pg.query("SELECT count(*)::int AS count FROM delivery_jobs WHERE status='delivered'")).rows[0].count,0);
  });
  await t.test('an unknown provider outcome is not automatically resent',async()=>{
    await pg.query("INSERT INTO delivery_jobs(recipient_id,channel,reference) VALUES($1,'email','TEST-unknown')",[patient]);
    let calls=0;const send=async()=>{calls++;return {status:'uncertain',error:'unknown'};};
    await processDeliveryJobs({db,env,send});await processDeliveryJobs({db,env,send});assert.equal(calls,1);
    assert.equal((await pg.query("SELECT status FROM delivery_jobs WHERE reference='TEST-unknown'")).rows[0].status,'uncertain');
  });
  await t.test('expired worker leases become uncertain instead of being sent twice',async()=>{
    await pg.query("INSERT INTO delivery_jobs(recipient_id,channel,reference,status,lease_until) VALUES($1,'sms','TEST-interrupted','processing',now()-interval '1 minute')",[patient]);
    await db.rpc('claim_delivery_jobs',{p_limit:10,p_channel:'sms'});
    assert.equal((await pg.query("SELECT status FROM delivery_jobs WHERE reference='TEST-interrupted'")).rows[0].status,'uncertain');
  });
  await t.test('local PostgreSQL backup restores rows, constraints, roles and workflow functions into an isolated copy',async()=>{
    const tables=(await pg.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(row=>row.tablename);
    const counts={};for(const table of tables)counts[table]=(await pg.query(`SELECT count(*)::int AS count FROM "${table}"`)).rows[0].count;
    const backup=await pg.dumpDataDir('gzip');assert.ok(backup.size>0);
    const restored=await PGlite.create({loadDataDir:backup});
    try{
      for(const table of tables)assert.equal((await restored.query(`SELECT count(*)::int AS count FROM "${table}"`)).rows[0].count,counts[table],table);
      assert.equal((await restored.query("SELECT has_table_privilege('authenticated','support_tickets','SELECT') AS allowed")).rows[0].allowed,false);
      assert.equal((await restored.query("SELECT count(*)::int AS count FROM pg_proc WHERE proname='book_appointment_slot'")).rows[0].count,1);
      await restored.query("INSERT INTO app_notifications(recipient_id,kind,title,body) VALUES($1,'test','RESTORE TEST','Test')",[patient]);
      assert.equal((await restored.query('SELECT count(*)::int AS count FROM delivery_jobs')).rows[0].count,counts.delivery_jobs+2);
      assert.equal((await pg.query('SELECT count(*)::int AS count FROM delivery_jobs')).rows[0].count,counts.delivery_jobs);
      await assert.rejects(restored.query('SELECT reply_support_ticket($1,$2,$3,NULL,false)',[other,appointment.id,'No access']),{code:'42501'});
    }finally{await restored.close();}
  });
});
