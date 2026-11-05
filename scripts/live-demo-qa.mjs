import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes,createHmac} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site='https://wellnest-healthcare.vercel.app';
const project='https://rduoszzxehdrefgjvook.supabase.co';
const roles=['patient','doctor','hospital','laboratory','pharmacy','insurance','administrator'];
export function assertOwnedUser(user,run,id){
  assert.match(run,/^[0-9a-f-]{36}$/);
  assert.equal(user?.id,id);
  assert.equal(user?.user_metadata?.qa_run_id,run,'Refusing cleanup of another account');
  assert.equal(user?.user_metadata?.qa_temporary,true);
  assert.ok(user.email?.endsWith('@example.test'));
}
function totp(secret){
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';
  for(const c of secret.toUpperCase().replace(/=+$/,'')){assert.ok(alphabet.includes(c));bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');}
  const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const digest=createHmac('sha1',Buffer.from(bytes)).update(counter).digest();const offset=digest.at(-1)&15;
  return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
async function main(){
  const args=process.argv.slice(2);
  if(!args.includes('--run')&&!args.includes('--cleanup')&&!args.includes('--diagnose')&&!args.includes('--prepare-storage')){
    console.log('Plan: seven temporary password accounts, four isolated QA organizations, real live API workflows, no email/SMS sends, then scoped cleanup. Use --run to execute.');return;
  }
  const env={...process.env};
  for(const line of (await readFile(resolve(root,'.env.local'),'utf8')).split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);if(m)env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');
  }
  const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL;assert.equal(url?.replace(/\/$/,''),project,'Unexpected project; no changes made');
  const reliableFetch=async(input,init={})=>{
    const method=(init.method||'GET').toUpperCase();const safe=['GET','HEAD','DELETE'].includes(method);
    for(let attempt=0;;attempt++){
      try{return await fetch(input,{...init,signal:init.signal||AbortSignal.timeout(45000)});}catch(e){if(!safe||attempt>=2)throw e;}
    }
  };
  const opts={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:reliableFetch}};
  const db=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,opts);
  if(args.includes('--prepare-storage')){
    const bucket=await db.storage.getBucket('medical-reports-private');
    if(bucket.error){assert.ok([400,404].includes(Number(bucket.error.status))&&/not found/i.test(bucket.error.message),'Bucket lookup failed; no storage changes made');const made=await db.storage.createBucket('medical-reports-private',{public:false,fileSizeLimit:3*1024*1024,allowedMimeTypes:['application/pdf','image/jpeg','image/png']});if(made.error)throw new Error(`Private storage creation failed (${made.error.status})`);}
    const checked=await db.storage.getBucket('medical-reports-private');assert.equal(checked.data?.public,false);console.log('Private report storage ready: 3 MB limit, PDF/JPEG/PNG, public access disabled.');return;
  }
  const anon=env.VITE_SUPABASE_ANON_KEY||env.SUPABASE_ANON_KEY;assert.ok(anon);
  const qaDir=resolve(root,'node_modules/.tmp/live-qa');await mkdir(qaDir,{recursive:true});
  let state;
  if(args.includes('--cleanup')||args.includes('--diagnose')){
    const option=args.includes('--cleanup')?'--cleanup':'--diagnose';
    const run=args[args.indexOf(option)+1];assert.match(run||'',/^[0-9a-f-]{36}$/);
    state=JSON.parse(await readFile(resolve(qaDir,`${run}.json`),'utf8'));assert.equal(state.run,run);
  }else state={run:randomUUID(),site,project,startedAt:new Date().toISOString(),users:{},orgs:{},checks:[],cleanup:'pending'};
  assert.equal(state.project,project);assert.equal(state.site,site);
  const manifest=resolve(qaDir,`${state.run}.json`);
  const save=async()=>{for(let attempt=0;;attempt++){try{await writeFile(manifest,JSON.stringify(state,null,2));return;}catch(e){if(!['EBUSY','EPERM'].includes(e.code)||attempt>=9)throw e;await delay(100);}}};
  const result=async promise=>{const r=await promise;if(r.error)throw new Error(`Database operation failed (${r.error.code||r.error.status||'unknown'})`);return r.data;};
  const users=state.users,orgs=state.orgs,tokens={},clients={};
  const tag=`TEST ONLY WellNest QA ${state.run.slice(0,8)}`;
  const log=message=>console.log(message);
  if(args.includes('--diagnose')){
    const r=await fetch(`${project}/rest/v1/`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(30000)});
    assert.equal(r.status,200);const schema=await r.json();
    console.log(JSON.stringify({recordShareSchema:schema.definitions?.record_shares,slots:await result(db.from('appointment_slots').select('id,closed').eq('doctor_id',users.doctor)),appointments:await result(db.from('appointments').select('id,status,slot_id').eq('patient_id',users.patient)),privateBucket:(await db.storage.getBucket('medical-reports-private')).data},null,2));return;
  }
  async function cleanup(){
    state.cleanup='running';await save();
    const ids=Object.values(users);const orgIds=Object.values(orgs);
    // Validate ownership before ANY deletion. Never discover targets by email wildcards.
    for(const id of ids){const r=await db.auth.admin.getUserById(id);if(r.error){assert.equal(r.error.status,404);continue;}assertOwnedUser(r.data.user,state.run,id);}
    for(const id of orgIds){const org=await result(db.from('organizations').select('id,legal_name').eq('id',id).maybeSingle());if(org)assert.equal(org.legal_name,`${tag} ${Object.keys(orgs).find(k=>orgs[k]===id)}`);}
    const remove=async(table,column,values)=>{if(!values.length)return;state.cleanupStep=`${table}.${column}`;const deletion=await db.from(table).delete().in(column,values).select(column);if(deletion.error)throw new Error(`Cleanup ${table}: ${deletion.error.message}`);const rows=await result(db.from(table).select(column).in(column,values).limit(1));assert.equal(rows.length,0,`${table} cleanup incomplete (${deletion.data?.length||0} rows deleted)`);};
    if(ids.length){
      const files=await result(db.from('storage_objects').select('id,bucket,object_key,organization_id').in('owner_user_id',ids));
      for(const f of files){assert.ok(orgIds.includes(f.organization_id));assert.ok(f.object_key.startsWith(`${f.organization_id}/lab-reports/`));await result(db.storage.from(f.bucket).remove([f.object_key]));const folder=f.object_key.slice(0,f.object_key.lastIndexOf('/'));const remaining=await result(db.storage.from(f.bucket).list(folder));assert.ok(!remaining.some(o=>o.name===f.object_key.split('/').at(-1)),'Uploaded object remains');}
      const tickets=await result(db.from('support_tickets').select('id').in('user_id',ids));
      await remove('support_messages','ticket_id',tickets.map(t=>t.id));await remove('support_messages','author_id',ids);
      await remove('support_tickets','user_id',ids);await remove('delivery_jobs','recipient_id',ids);
      await remove('app_notifications','recipient_id',ids);
      await remove('record_shares','patient_id',ids);
      await remove('lab_reports','patient_id',ids);
      await remove('storage_objects','owner_user_id',ids);
      await remove('lab_report_versions','patient_user_id',ids);await remove('lab_orders','patient_user_id',ids);
      await remove('pharmacy_prescription_events','patient_user_id',ids);
      await remove('insurance_claims','patient_user_id',ids);await remove('insurance_plans','patient_id',ids);
      await remove('appointments','patient_id',ids);await remove('appointment_slots','doctor_id',ids);await remove('doctor_schedules','doctor_id',ids);
      await remove('prescriptions','patient_id',ids);await remove('records','patient_id',ids);
      await remove('access_grants','patient_user_id',ids);await remove('access_requests','patient_user_id',ids);
      await remove('health_audit_logs','actor_id',ids);await remove('audit_events','actor_user_id',ids);
    }
    await remove('hospital_entries','organization_id',orgIds);await remove('pharmacy_inventory','organization_id',orgIds);
    await remove('audit_events','organization_id',orgIds);
    await remove('organization_documents','organization_id',orgIds);await remove('organization_memberships','organization_id',orgIds);
    for(const id of ids){const r=await db.auth.admin.getUserById(id);if(!r.error){assertOwnedUser(r.data.user,state.run,id);await result(db.auth.admin.deleteUser(id));}const check=await db.auth.admin.getUserById(id);assert.equal(check.error?.status,404,'Auth account remains');}
    await remove('organizations','id',orgIds);
    state.cleanup='verified: accounts, organizations, workflow rows and uploaded objects removed';state.finishedAt=new Date().toISOString();await save();log(`CLEANUP PASS: ${ids.length} accounts and ${orgIds.length} organizations removed`);
  }
  if(args.includes('--cleanup')){await cleanup();return;}
  await save();log(`Run ${state.run}`);
  const call=async(role,path,method='GET',body,token)=>{
    let response;
    try{response=await reliableFetch(new URL(path,site),{method,headers:{...(role?{Authorization:`Bearer ${token||tokens[role]}`} :{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});}catch(e){throw new Error(`${role||'guest'} ${method} ${path}: ${e.name==='TimeoutError'?'request timed out; outcome must be checked':e.message}`);}
    const type=response.headers.get('content-type')||'';const data=type.includes('json')?await response.json():{error:'Non-JSON response'};return {status:response.status,data};
  };
  const expect=async(role,path,method='GET',body,status=200,token)=>{
    const r=await call(role,path,method,body,token);assert.equal(r.status,status,`${role||'guest'} ${method} ${path}: ${r.data?.error||'unexpected response'}`);return r.data;
  };
  async function check(name,fn){try{await fn();state.checks.push({name,result:'PASS'});log(`PASS ${name}`);}catch(e){state.checks.push({name,result:'FAIL',error:e.message});log(`FAIL ${name}: ${e.message}`);}await save();}
  let healthId,grantId,recordId,rxId,appointmentId,slotId,claimId,shareId;
  const today=new Date().toISOString().slice(0,10);
  try{
    for(const role of roles){
      const password=randomBytes(32).toString('base64url');
      const email=`wellnest-qa-${state.run}-${role}@example.test`;
      const created=await result(db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:`${tag} ${role}`,qa_run_id:state.run,qa_temporary:true}}));
      users[role]=created.user.id;await save();
      await result(db.from('profiles').update({role,role_verified:role!=='patient',full_name:`${tag} ${role}`,account_status:'active'}).eq('id',users[role]));
      await result(db.from('notification_preferences').upsert({user_id:users[role],email:false,sms:false,product:false}));
      clients[role]=createClient(project,anon,opts);const login=await result(clients[role].auth.signInWithPassword({email,password}));tokens[role]=login.session.access_token;
    }
    for(const kind of ['hospital','laboratory','pharmacy','insurance']){
      const id=randomUUID();orgs[kind]=id;await save();
      await result(db.from('organizations').insert({id,kind,legal_name:`${tag} ${kind}`,display_name:`${tag} ${kind}`,status:'verified',verified_at:new Date().toISOString()}));
    }
    for(const role of ['doctor','hospital','laboratory','pharmacy','insurance']){
      const id=orgs[role==='doctor'?'hospital':role];
      await result(db.from('organization_memberships').insert({organization_id:id,user_id:users[role],role:role==='doctor'?'doctor':`${role}_admin`,status:'active',verified_at:new Date().toISOString()}));
      await result(db.from('profiles').update({organization_id:id,organization:`${tag} ${role==='doctor'?'hospital':role}`}).eq('id',users[role]));
    }
    await check('seven normal sign-ins and portal backend reads',async()=>{
      for(const [role,path]of Object.entries({patient:'/api/records',doctor:'/api/appointments',hospital:'/api/hospital/entries',laboratory:'/api/lab/orders',pharmacy:'/api/pharmacy/inventory',insurance:'/api/insurance/claims',administrator:'/api/admin/health'}))await expect(role,path);
      for(const role of ['doctor','hospital','laboratory','pharmacy','insurance']){const data=await expect(role,'/api/organizations/me');assert.equal(data.organization.id,orgs[role==='doctor'?'hospital':role]);}
    });
    await check('anonymous and wrong-role access blocked',async()=>{
      for(const path of ['/api/records','/api/hospital/entries','/api/lab/orders','/api/pharmacy/inventory','/api/insurance/claims','/api/admin/users'])await expect(null,path,'GET',undefined,401);
      for(const path of ['/api/admin/users','/api/hospital/entries','/api/pharmacy/inventory','/api/insurance/claims'])await expect('patient',path,'GET',undefined,403);
    });
    await check('portal menu data endpoints and account settings load',async()=>{
      const matrix={
        patient:['records','prescriptions','appointments','lab-reports','medications','vaccinations','insurance','timeline','access-grants','access-requests','health-audit'],
        doctor:['appointments','availability','access-grants','access-requests','health-audit'],
        hospital:['hospital/entries','organizations/members'],
        laboratory:['lab/orders','lab/report-versions','organizations/members'],
        pharmacy:['pharmacy/prescriptions','pharmacy/inventory','organizations/members'],
        insurance:['insurance/policies','insurance/claims','organizations/members'],
        administrator:['admin/users','admin/audit','admin/organizations','admin/pending-applications','admin/health','admin/integrations'],
      };
      const requests=Object.entries(matrix).flatMap(([role,paths])=>[...paths,'profile','notifications','app-notifications','support'].map(path=>[role,`/api/${path}`]));
      for(let i=0;i<requests.length;i+=4)await Promise.all(requests.slice(i,i+4).map(([role,path])=>expect(role,path)));
      state.menuEndpointsChecked=requests.length;
    });
    await check('patient identity and upload attribution',async()=>{
      const identity=await expect('patient','/api/health-id','POST',{},201);healthId=identity.health_id||identity.identity?.health_id;assert.ok(healthId);
      const {record}=await expect('patient','/api/records','POST',{title:tag,category:'upload',source:'verified',created_by:users.doctor,status:'signed'},201);
      assert.equal(record.source,'uploaded');assert.equal(record.status,'pending');assert.equal(record.created_by,users.patient);
    });
    await check('five patient-approved provider consent requests',async()=>{
      assert.ok(healthId);await expect('doctor',`/api/records?patientUserId=${users.patient}`,'GET',undefined,400);
      for(const role of ['doctor','hospital','laboratory','pharmacy','insurance']){
        const requested=await expect(role,'/api/access-requests','POST',{healthId,purpose:tag,durationHours:72},201);
        await expect('patient','/api/access-requests','PUT',{id:requested.request?.id||requested.id,status:'approved'});
      }
      const grants=await result(db.from('access_grants').select('id,requester_id').eq('patient_user_id',users.patient));grantId=grants.find(g=>g.requester_id===users.doctor)?.id;assert.ok(grantId);
    });
    await check('shared calendar and simultaneous booking conflict',async()=>{
      const start=new Date(Date.now()+48*3600000);start.setUTCSeconds(0,0);
      const slot=await expect('doctor','/api/availability','POST',{startsAt:start.toISOString(),endsAt:new Date(+start+1800000).toISOString(),timezone:'Asia/Kolkata'},201);slotId=slot.id;
      const body={doctorId:users.doctor,slotId,title:tag,reason:'Synthetic software test; no care requested'};
      const settled=await Promise.allSettled([call('patient','/api/appointments','POST',body),call('patient','/api/appointments','POST',body)]);
      for(const outcome of settled)if(outcome.status==='rejected')throw outcome.reason;
      const reserved=settled.map(outcome=>outcome.value);
      assert.deepEqual(reserved.map(r=>r.status).sort(),[201,409]);appointmentId=reserved.find(r=>r.status===201).data.id;
      assert.ok((await expect('doctor','/api/appointments')).some(r=>r.id===appointmentId));
      await expect('doctor','/api/availability','POST',{startsAt:new Date(+start+600000).toISOString(),endsAt:new Date(+start+1800000).toISOString(),timezone:'Asia/Kolkata'},409);
      const next=await expect('doctor','/api/availability','POST',{startsAt:new Date(+start+3600000).toISOString(),endsAt:new Date(+start+5400000).toISOString(),timezone:'Asia/Kolkata'},201);
      await expect('patient','/api/appointments','PATCH',{id:appointmentId,action:'reschedule',slotId:next.id});
      assert.equal((await expect('patient','/api/appointments')).find(r=>r.id===appointmentId).slot_id,next.id);
      await expect('doctor','/api/availability','PATCH',{id:next.id},409);
      await expect('patient','/api/appointments','PATCH',{id:appointmentId,action:'cancel'});
      await expect('doctor','/api/availability','PATCH',{id:slotId});await expect('doctor','/api/availability','PATCH',{id:next.id});
    });
    await check('doctor consultation, prescription and recipient share',async()=>{
      assert.ok(grantId);const {record}=await expect('doctor','/api/records','POST',{grantId,title:`${tag} consultation`,category:'visit',summary:'Synthetic software test. No diagnosis or treatment.',date:today,source:'uploaded',created_by:users.patient},201);
      recordId=record.id;assert.equal(record.source,'verified');assert.equal(record.created_by,users.doctor);
      assert.ok((await expect('patient','/api/records')).some(r=>r.id===recordId));
      const rx=await expect('doctor','/api/prescriptions','POST',{grantId,lines:[{medicine:`${tag} DO NOT DISPENSE`,dosage:'Test only',duration:'Test only',instructions:'Synthetic software test, no treatment ordered'}]},201);rxId=rx[0]?.id;assert.ok(rxId);
      assert.ok((await expect('patient','/api/prescriptions')).some(r=>r.id===rxId));
      const share=await expect('patient','/api/record-share','POST',{recordId,grantId},201);shareId=share.shareId;
      await expect('doctor',`/api/record-share?shareId=${shareId}`);await expect('laboratory',`/api/record-share?shareId=${shareId}`,'GET',undefined,404);
    });
    await check('pharmacy dispensing transitions and patient notification',async()=>{
      assert.ok(rxId);assert.ok((await expect('pharmacy','/api/pharmacy/prescriptions')).some(r=>r.id===rxId));
      const path=`/api/pharmacy/prescriptions/${rxId}`;
      await expect('pharmacy',path,'POST',{});await expect('pharmacy',path,'PATCH',{status:'ready'});await expect('pharmacy',path,'POST',{});
      const event=await result(db.from('pharmacy_prescription_events').select('dispensing_status').eq('prescription_id',rxId).single());assert.equal(event.dispensing_status,'ready');
      await expect('pharmacy',path,'PATCH',{status:'completed'});await expect('pharmacy',path,'POST',{},409);await expect('pharmacy',path,'PATCH',{status:'processing'},409);
      assert.ok((await expect('patient','/api/app-notifications')).some(r=>r.kind==='pharmacy'));
    });
    await check('pharmacy inventory persistence and stale edit protection',async()=>{
      const row=await expect('pharmacy','/api/pharmacy/inventory','POST',{name:tag,sku:state.run,form:'TEST',strength:'TEST',lot:state.run,expires:'2028-01-01',controlled:false,onHand:5,reorder:1},201);
      await expect('pharmacy','/api/pharmacy/inventory','PATCH',{id:row.id,version:row.version,onHand:4});
      await expect('pharmacy','/api/pharmacy/inventory','PATCH',{id:row.id,version:row.version,onHand:3},409);
      assert.equal((await expect('pharmacy','/api/pharmacy/inventory')).find(r=>r.id===row.id).onHand,4);
    });
    await check('hospital admission, clinician-only discharge and linked records',async()=>{
      const chart=await expect('hospital','/api/hospital/entries','POST',{kind:'patients',payload:{name:tag,dob:'2000-01-01',healthId}},201);
      await expect('hospital','/api/hospital/entries','POST',{kind:'consults',payload:{patientId:chart.id,diagnosis:`${tag} no clinical assessment`,notes:'Synthetic only',date:today}},201);
      const admission=await expect('hospital','/api/hospital/entries','POST',{kind:'admissions',payload:{patientId:chart.id,room:tag,bed:'TEST',admitted:today,status:'admitted'}},201);
      await expect('hospital','/api/hospital/entries','PATCH',{kind:'admissions',id:admission.id,version:admission.version,payload:{...admission.payload,status:'pending-discharge'}});
      const draft=(await expect('hospital','/api/hospital/entries')).find(r=>r.kind==='discharges'&&r.payload.admissionId===admission.id);assert.ok(draft);
      const body={kind:'discharges',id:draft.id,version:draft.version,payload:{...draft.payload,diagnosis:tag,instructions:'Synthetic only, no clinical care',approved:true}};
      await expect('hospital','/api/hospital/entries','PATCH',body,403);
      await result(db.from('organization_memberships').update({role:'hospital_doctor'}).eq('user_id',users.hospital).eq('organization_id',orgs.hospital));
      try{await expect('hospital','/api/hospital/entries','PATCH',body);}finally{await result(db.from('organization_memberships').update({role:'hospital_admin'}).eq('user_id',users.hospital).eq('organization_id',orgs.hospital));}
      assert.equal((await expect('hospital','/api/hospital/entries')).find(r=>r.id===admission.id).payload.status,'discharged');
      const records=await expect('patient','/api/records');assert.ok(records.some(r=>r.title==='Hospital discharge summary'&&r.source==='verified'&&r.created_by===users.hospital));
    });
    async function labVersion(suffix){const order=await expect('laboratory','/api/lab/orders','POST',{healthId,accessionNumber:`${state.run}-${suffix}`,testName:`${tag} panel`,testKind:'Blood Test',priority:'routine'},201);return expect('laboratory',`/api/lab/orders/${order.id}/report-versions`,'POST',{impression:'Synthetic only. No clinical result.',analytes:[{name:'TEST',value:'1',unit:'test',referenceRange:'0-2'}]},201);}
    await check('laboratory verified structured release reaches patient',async()=>{
      const version=await labVersion('structured');await expect('laboratory',`/api/lab/report-versions/${version.id}/verify`,'POST',{});await expect('laboratory',`/api/lab/report-versions/${version.id}/release`,'POST',{});
      assert.ok((await expect('patient','/api/lab-reports')).some(r=>r.source_version_id===version.id||r.test_name===`${tag} panel`));
    });
    await check('private upload and unscanned release/download protection',async()=>{
      const version=await labVersion('file');const path=`/api/lab/report-versions/${version.id}`;
      const file={fileName:'synthetic-qa.pdf',mimeType:'application/pdf',contentBase64:Buffer.from('%PDF-1.7 Synthetic QA only').toString('base64')};
      await expect('laboratory',path+'/file','POST',{...file,contentBase64:Buffer.from('not PDF').toString('base64')},415);
      await expect('laboratory',path+'/file','POST',file,201);await expect('laboratory',path+'/file','POST',file,409);
      const meta=await expect('laboratory',path+'/file');assert.ok(['pending','error'].includes(meta.file.scan_status));
      await expect('laboratory',path+'/verify','POST',{});await expect('laboratory',path+'/release','POST',{},409);
      const download=await call('patient',path+'/download');assert.ok([403,404,409].includes(download.status));assert.equal(download.data.url,undefined);
    });
    await check('insurance policy, claim review and revoked consent',async()=>{
      const policy=await expect('insurance','/api/insurance/policies','POST',{healthId,planName:tag,policyNumber:state.run,coverageType:'Test',coverageLimit:100,deductible:0},201);
      assert.equal((await expect('patient','/api/insurance')).plan.id,policy.id);
      const claim=await expect('insurance','/api/insurance/claims','POST',{healthId,policyId:policy.id,serviceType:tag,amount:10},201);claimId=claim.id;
      await expect('insurance',`/api/insurance/claims/${claimId}/review`,'PATCH',{status:'approved',note:tag});
      const grant=await result(db.from('access_grants').select('id').eq('patient_user_id',users.patient).eq('requester_id',users.insurance).single());
      await expect('patient','/api/access-grants','PUT',{id:grant.id});assert.deepEqual(await expect('insurance','/api/insurance/claims'),[]);assert.deepEqual(await expect('insurance','/api/insurance/policies'),[]);
      await expect('insurance',`/api/insurance/claims/${claimId}/review`,'PATCH',{status:'paid'},403);
    });
    await check('private support, admin reply, export and delivery queue',async()=>{
      const ticket=await expect('patient','/api/support','POST',{category:'privacy_export',subject:tag,body:'Synthetic test only'},201);
      await expect('administrator','/api/support','PATCH',{id:ticket.id,body:'Synthetic reply',status:'in_progress'});
      assert.equal((await expect('patient',`/api/support?id=${ticket.id}`)).messages.length,2);await expect('doctor',`/api/support?id=${ticket.id}`,'GET',undefined,404);
      const exported=await expect('patient','/api/privacy-export');assert.ok(exported.records.some(r=>r.id===recordId));assert.ok(exported.records.every(r=>r.patient_id===users.patient));
      const jobs=await result(db.from('delivery_jobs').select('id,status').eq('recipient_id',users.patient));assert.ok(jobs.length>0);assert.ok(jobs.every(j=>['pending','skipped'].includes(j.status)));
      const integration=await expect('administrator','/api/admin/integrations');state.services={scanner:integration.scanner,scheduler:integration.scheduler};
      assert.ok((await expect('administrator','/api/admin/audit')).some(event=>Object.values(users).includes(event.actor)));
      const deletion=await expect('patient','/api/support','POST',{category:'privacy_deletion',subject:tag,body:'Synthetic deletion REVIEW request only'},201);
      await expect('administrator','/api/support','PATCH',{id:deletion.id,body:'Synthetic review closed; demo cleanup is performed separately',status:'closed'});
      await expect('patient','/api/records');
    });
    await check('revocation closes provider record and shared-link access',async()=>{
      assert.ok(grantId);await expect('patient','/api/access-grants','PUT',{id:grantId});await expect('doctor',`/api/records?grantId=${grantId}`,'GET',undefined,403);
      if(shareId)await expect('doctor',`/api/record-share?shareId=${shareId}`,'GET',undefined,403);
    });
    await check('administrator suspension blocks access without changing the role',async()=>{
      await expect('administrator','/api/admin/users','PATCH',{id:users.patient,status:'suspended'});
      try{await expect('patient','/api/records','GET',undefined,403);const row=await result(db.from('profiles').select('role,account_status').eq('id',users.patient).single());assert.equal(row.role,'patient');assert.equal(row.account_status,'suspended');}
      finally{await expect('administrator','/api/admin/users','PATCH',{id:users.patient,status:'active'});}
      await expect('patient','/api/records');await expect('administrator','/api/admin/users','PATCH',{id:users.administrator,status:'suspended'},400);
    });
    await check('real authenticator enrollment, AAL2 and recovery isolation',async()=>{
      const client=clients.administrator,oldToken=tokens.administrator;
      const factor=await result(client.auth.mfa.enroll({factorType:'totp',friendlyName:'Disposable QA factor'}));
      const verified=await result(client.auth.mfa.challengeAndVerify({factorId:factor.id,code:totp(factor.totp.secret)}));tokens.administrator=verified.access_token;
      await expect('administrator','/api/admin/health','GET',undefined,403,oldToken);await expect('administrator','/api/admin/health');
      await expect('administrator','/api/privacy-export','GET',undefined,403,oldToken);
      await expect('administrator','/api/support','POST',{category:'mfa_recovery',subject:tag,body:'Synthetic recovery request; no bypass'},201,oldToken);
      const r=await fetch(`${project}/rest/v1/profiles?id=eq.${users.administrator}&select=id`,{headers:{apikey:anon,Authorization:`Bearer ${oldToken}`},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.deepEqual(await r.json(),[]);
    });
  }catch(e){state.checks.push({name:'provisioning or execution',result:'FAIL',error:e.message});log(`FAIL setup: ${e.message}`);}
  finally{
    for(let attempt=1;attempt<=3;attempt++){
      try{await cleanup();break;}catch(e){state.cleanup=`FAILED: ${e.message}`;await save();log(`Cleanup attempt ${attempt}: ${e.message}`);if(attempt===3)log(`CLEANUP FAILED. Retry with --cleanup ${state.run}`);}
    }
    await mkdir(resolve(root,'docs'),{recursive:true});
    const lines=[`# Disposable live portal test report`,``,`Run: ${state.run}`,`Started: ${state.startedAt}`,`Site: ${site}`,``,`Normal Supabase password sign-ins and real deployed HTTP endpoints; no authentication fixtures. Only temporary synthetic accounts and organizations were changed.`, ``,`| Check | Result | Detail |`,`| --- | --- | --- |`,...state.checks.map(c=>`| ${c.name} | ${c.result} | ${(c.error||'').replaceAll('|','/').replaceAll('\n',' ')} |`),``,`Cleanup: ${state.cleanup}.`,``,`These checks do not certify every UI page or guarantee absence of errors. Views refresh by polling, not WebSocket subscriptions. No email/SMS messages were sent. Public malware scanning and production backup restoration require their external services. Local ClamAV and synthetic recovery drills are separate evidence. No patient information, passwords, tokens or MFA secrets are included.`];
    await writeFile(resolve(root,'docs/live-demo-test-report.md'),lines.join('\n')+'\n');
  }
  if(state.checks.some(c=>c.result==='FAIL')||!state.cleanup.startsWith('verified:'))process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(`Stopped: ${e.message}`);process.exitCode=1;});
