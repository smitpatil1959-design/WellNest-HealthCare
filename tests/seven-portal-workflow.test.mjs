import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createTestDatabase} from './helpers/create-test-database.mjs';
import {pgApiAdapter} from './helpers/pg-api-adapter.mjs';

test('seven portals share an authenticated, consent-controlled PostgreSQL workflow',async t=>{
  const pg=await createTestDatabase();t.after(()=>pg.close());
  const db=pgApiAdapter(pg);globalThis.__wellnestWorkflowDb=db;
  const hook=registerHooks({load(url,context,next){if(url.endsWith('/server-api-handlers/db-client.js'))return {format:'module',shortCircuit:true,source:'export const isDbConfigured=true;export const dbConfigurationError=null;export default globalThis.__wellnestWorkflowDb;'};return next(url,context);}});
  t.after(()=>{hook.deregister();delete globalThis.__wellnestWorkflowDb;});
  const dispatch=(await import('../server-api-handlers/dispatcher.js?workflow')).default;
  const roles=['patient','doctor','hospital','laboratory','pharmacy','insurance','administrator'];const users={};const tokens={};const orgs={};
  for(let index=0;index<roles.length;index++){
    const role=roles[index],id=`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`;users[role]=id;
    await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)',[id,`${role}@example.test`,JSON.stringify({full_name:`Test ${role}`})]);
    await pg.query('UPDATE profiles SET role=$2,role_verified=$3 WHERE id=$1',[id,role,role!=='patient']);
    const token=`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({sub:id,aal:'aal1'})).toString('base64url')}.fixture-${role}`;tokens[role]=token;db.sessions.set(token,id);
  }
  for(const [index,kind]of ['hospital','laboratory','pharmacy','insurance'].entries()){
    const id=`10000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`;orgs[kind]=id;
    await pg.query("INSERT INTO organizations(id,kind,legal_name,display_name,status,verified_at) VALUES($1,$2,$3,$3,'verified',now())",[id,kind,`Test ${kind}`]);
  }
  for(const role of roles.filter(role=>!['patient','administrator'].includes(role))){
    const kind=role==='doctor'?'hospital':role;const memberRole=role==='doctor'?'doctor':`${role}_admin`;
    await pg.query("INSERT INTO organization_memberships(organization_id,user_id,role,status,verified_at) VALUES($1,$2,$3,'active',now())",[orgs[kind],users[role],memberRole]);
    await pg.query('UPDATE profiles SET organization_id=$2 WHERE id=$1',[users[role],orgs[kind]]);
  }
  const call=async(role,path,method='GET',body)=>{
    const url=new URL(path,'https://test.example');const query=Object.fromEntries(url.searchParams);query.path=url.pathname.replace(/^\/api\//,'');
    const req={method,url:path,query,headers:role?{authorization:`Bearer ${tokens[role]}`}:{},body};
    const res={statusCode:200,headers:{},setHeader(key,value){this.headers[key]=value;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},end(){return this;}};
    await dispatch(req,res);return res;
  };
  const expect=async(role,path,method,body,status=200)=>{const response=await call(role,path,method,body);assert.equal(response.statusCode,status,`${role} ${method||'GET'} ${path}: ${JSON.stringify(response.body)}`);return response.body;};
  let healthId,grantId,appointmentId,rxId,orderId,versionId,policyId,claimId;
  await t.test('all seven roles load their own real backend data',async()=>{
    const paths={patient:'/api/records',doctor:'/api/appointments',hospital:'/api/hospital/entries',laboratory:'/api/lab/orders',pharmacy:'/api/pharmacy/inventory',insurance:'/api/insurance/claims',administrator:'/api/admin/users'};
    for(const role of roles)await expect(role,paths[role]);
    for(const role of ['hospital','laboratory','pharmacy','insurance','doctor']){const context=await expect(role,'/api/organizations/me');assert.equal(context.organization.id,orgs[role==='doctor'?'hospital':role]);}
  });
  await t.test('unauthenticated requests and cross-role API access are rejected',async()=>{
    for(const path of ['/api/records','/api/hospital/entries','/api/lab/orders','/api/pharmacy/inventory','/api/insurance/claims','/api/admin/users'])assert.equal((await call(null,path)).statusCode,401);
    for(const path of ['/api/admin/users','/api/hospital/entries','/api/pharmacy/inventory','/api/insurance/claims'])assert.equal((await call('patient',path)).statusCode,403);
  });
  await t.test('patient creates a real health identity',async()=>{
    const result=await expect('patient','/api/health-id','POST',{},201);healthId=result.health_id||result.identity?.health_id;assert.ok(healthId);
  });
  await t.test('patient uploads cannot spoof provider attribution or a signed status',async()=>{
    const result=await expect('patient','/api/records','POST',{title:'TEST patient upload',category:'upload',source:'verified',created_by:users.doctor,status:'signed',doctor:'Untrusted supplied name'},201);
    assert.equal(result.record.source,'uploaded');assert.equal(result.record.created_by,users.patient);assert.equal(result.record.status,'pending');
  });
  await t.test('legacy records are not verified from display names or status text',async()=>{
    const row=(await pg.query("INSERT INTO records(patient_id,title,category,source,status,doctor) VALUES($1,'TEST legacy','visit','verified','signed','Unverified name') RETURNING id",[users.patient])).rows[0];
    const result=await expect('patient','/api/records?id='+row.id);assert.equal(result.source,'unknown');assert.equal(result.created_by,null);
  });
  await t.test('providers have no patient record access before consent',async()=>{
    assert.equal((await call('doctor','/api/records?patientUserId='+users.patient)).statusCode,400);
    assert.deepEqual(await expect('pharmacy','/api/pharmacy/prescriptions'),[]);
  });
  await t.test('patient authorizes each care provider through the real request workflow',async()=>{
    for(const role of ['doctor','hospital','laboratory','pharmacy','insurance']){
      const categories=role==='insurance'?['authorized claims']:role==='pharmacy'?['prescription']:['clinical history','lab results','prescription'];
      const requested=await expect(role,'/api/access-requests','POST',{healthId,categories,purpose:'TEST workflow',durationHours:72},201);
      const id=requested.request?.id||requested.id;
      await expect('patient','/api/access-requests','PUT',{id,status:'approved'});
    }
    const grants=(await pg.query('SELECT id FROM access_grants WHERE requester_id=$1',[users.doctor])).rows;grantId=grants[0].id;
  });
  await t.test('doctor publishes availability and patient reserves one shared slot',async()=>{
    const start=new Date(Date.now()+48*3600000);start.setUTCSeconds(0,0);
    const slot=await expect('doctor','/api/availability','POST',{startsAt:start.toISOString(),endsAt:new Date(start.getTime()+1800000).toISOString(),timezone:'Asia/Kolkata'},201);
    const reserved=await expect('patient','/api/appointments','POST',{doctorId:users.doctor,slotId:slot.id,title:'TEST visit',reason:'Test workflow'},201);appointmentId=reserved.id;
    assert.equal((await call('patient','/api/appointments','POST',{doctorId:users.doctor,slotId:slot.id,title:'TEST duplicate'})).statusCode,409);
    assert.ok((await expect('doctor','/api/appointments')).some(row=>row.id===appointmentId));
  });
  await t.test('doctor writes a consultation and prescription visible to the patient',async()=>{
    const note=await expect('doctor','/api/records','POST',{grantId,title:'TEST consultation',category:'visit',summary:'Test consultation note',date:new Date().toISOString().slice(0,10),source:'uploaded',created_by:users.patient},201);
    assert.equal(note.record.source,'verified');assert.equal(note.record.created_by,users.doctor);
    const prescription=await expect('doctor','/api/prescriptions','POST',{grantId,lines:[{medicine:'TEST medicine',dosage:'Test dose',duration:'Test duration',instructions:'Test instructions'}]},201);
    rxId=prescription[0]?.id;assert.ok(rxId);
    assert.ok((await expect('patient','/api/prescriptions')).some(row=>row.id===rxId));
    assert.ok((await expect('patient','/api/records')).some(row=>row.title==='TEST consultation'));
  });
  await t.test('patient report shares retain the recipient after consent is rechecked',async()=>{
    const record=(await pg.query("SELECT id FROM records WHERE patient_id=$1 AND title='TEST consultation'",[users.patient])).rows[0];
    const share=await expect('patient','/api/record-share','POST',{recordId:record.id,grantId},201);
    const saved=(await pg.query('SELECT recipient_id FROM record_shares WHERE id=$1',[share.shareId])).rows[0];
    assert.equal(saved.recipient_id,users.doctor);
    assert.equal((await expect('doctor','/api/record-share?shareId='+share.shareId)).record.id,record.id);
    assert.equal((await call('laboratory','/api/record-share?shareId='+share.shareId)).statusCode,404);
  });
  await t.test('pharmacy verifies and prepares the same authorized prescription',async()=>{
    assert.ok((await expect('pharmacy','/api/pharmacy/prescriptions')).some(row=>row.id===rxId));
    await expect('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'POST',{});
    await expect('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'PATCH',{status:'ready'});
    const row=(await pg.query('SELECT dispensing_status FROM pharmacy_prescription_events WHERE prescription_id=$1',[rxId])).rows[0];assert.equal(row.dispensing_status,'ready');
    await expect('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'POST',{});
    assert.equal((await pg.query('SELECT dispensing_status FROM pharmacy_prescription_events WHERE prescription_id=$1',[rxId])).rows[0].dispensing_status,'ready');
    await expect('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'PATCH',{status:'completed'});
    assert.equal((await call('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'POST',{})).statusCode,409);
    assert.equal((await call('pharmacy',`/api/pharmacy/prescriptions/${rxId}`,'PATCH',{status:'processing'})).statusCode,409);
    assert.ok((await expect('patient','/api/app-notifications')).some(row=>row.kind==='pharmacy'));
  });
  await t.test('hospital chart, admission, discharge and patient records share one real workflow',async()=>{
    const chart=await expect('hospital','/api/hospital/entries','POST',{kind:'patients',payload:{name:'TEST hospital patient',dob:'2000-01-01',healthId}},201);
    await expect('hospital','/api/hospital/entries','POST',{kind:'consults',payload:{patientId:chart.id,diagnosis:'TEST hospital consultation',notes:'Test note',date:new Date().toISOString().slice(0,10)}},201);
    const issued=(await pg.query("SELECT source,created_by FROM records WHERE summary LIKE 'TEST hospital consultation%'" )).rows[0];assert.equal(issued.source,'verified');assert.equal(issued.created_by,users.hospital);
    const admission=await expect('hospital','/api/hospital/entries','POST',{kind:'admissions',payload:{patientId:chart.id,room:'TEST-WARD',bed:'TEST-A',admitted:new Date().toISOString().slice(0,10),status:'admitted'}},201);
    await expect('hospital','/api/hospital/entries','PATCH',{kind:'admissions',id:admission.id,version:admission.version,payload:{...admission.payload,status:'pending-discharge'}});
    const draft=(await expect('hospital','/api/hospital/entries')).find(row=>row.kind==='discharges'&&row.payload.admissionId===admission.id);
    const body={kind:'discharges',id:draft.id,version:draft.version,payload:{...draft.payload,diagnosis:'TEST discharge',instructions:'Test follow-up instructions',approved:true}};
    assert.equal((await call('hospital','/api/hospital/entries','PATCH',body)).statusCode,403);
    await pg.query("UPDATE organization_memberships SET role='hospital_doctor' WHERE user_id=$1",[users.hospital]);
    await expect('hospital','/api/hospital/entries','PATCH',body);
    assert.equal((await pg.query('SELECT payload FROM hospital_entries WHERE id=$1',[admission.id])).rows[0].payload.status,'discharged');
    assert.ok((await expect('patient','/api/records')).some(row=>row.title==='Hospital discharge summary'));
    await pg.query("UPDATE organization_memberships SET role='hospital_admin' WHERE user_id=$1",[users.hospital]);
  });
  await t.test('laboratory creates, verifies and publishes a structured report',async()=>{
    const order=await expect('laboratory','/api/lab/orders','POST',{healthId,accessionNumber:'TEST-LAB-001',testName:'TEST panel',testKind:'Blood Test',priority:'routine'},201);orderId=order.id;
    const version=await expect('laboratory',`/api/lab/orders/${orderId}/report-versions`,'POST',{impression:'Test interpretation',analytes:[{name:'Test analyte',value:'1',unit:'test',referenceRange:'0-2'}]},201);versionId=version.id;
    await expect('laboratory',`/api/lab/report-versions/${versionId}/verify`,'POST',{});
    await expect('laboratory',`/api/lab/report-versions/${versionId}/release`,'POST',{});
    assert.ok((await expect('patient','/api/lab-reports')).length>0);
  });
  await t.test('unscanned files cannot be released, downloaded or replaced silently',async()=>{
    const order=await expect('laboratory','/api/lab/orders','POST',{healthId,accessionNumber:'TEST-FILE-001',testName:'TEST file',testKind:'Blood Test'},201);
    const report=await expect('laboratory',`/api/lab/orders/${order.id}/report-versions`,'POST',{impression:'Test attachment',analytes:[]},201);
    const path=`/api/lab/report-versions/${report.id}`;
    const file={fileName:'test.pdf',mimeType:'application/pdf',contentBase64:Buffer.from('%PDF-1.7 test-only fixture').toString('base64')};
    assert.equal((await call('laboratory',path+'/file','POST',{...file,contentBase64:Buffer.from('not a pdf').toString('base64')})).statusCode,415);
    await expect('laboratory',path+'/file','POST',file,201);
    assert.equal((await call('laboratory',path+'/file','POST',file)).statusCode,409);
    const meta=await expect('laboratory',path+'/file');assert.equal(meta.file.scan_status,'pending');
    await expect('laboratory',path+'/verify','POST',{});
    assert.equal((await call('laboratory',path+'/release','POST',{})).statusCode,409);
    const download=await call('patient',path+'/download');assert.ok([403,404,409].includes(download.statusCode));assert.equal(download.body.url,undefined);
  });
  await t.test('a failed patient-report insert rolls the entire lab release back',async()=>{
    const order=await expect('laboratory','/api/lab/orders','POST',{healthId,accessionNumber:'TEST-ROLLBACK-001',testName:'ROLLBACK_TEST',testKind:'Blood Test'},201);
    const report=await expect('laboratory',`/api/lab/orders/${order.id}/report-versions`,'POST',{impression:'Test rollback',analytes:[]},201);
    await expect('laboratory',`/api/lab/report-versions/${report.id}/verify`,'POST',{});
    await pg.exec("ALTER TABLE lab_reports ADD CONSTRAINT test_reject_release CHECK(test_name<>'ROLLBACK_TEST')");
    try{assert.equal((await call('laboratory',`/api/lab/report-versions/${report.id}/release`,'POST',{})).statusCode,503);
      assert.equal((await pg.query('SELECT status FROM lab_report_versions WHERE id=$1',[report.id])).rows[0].status,'verified');
      assert.equal((await pg.query('SELECT count(*)::int AS count FROM lab_reports WHERE source_version_id=$1',[report.id])).rows[0].count,0);
    }finally{await pg.exec('ALTER TABLE lab_reports DROP CONSTRAINT test_reject_release');}
  });
  await t.test('insurance policy and claim use the authorized patient identity',async()=>{
    const policy=await expect('insurance','/api/insurance/policies','POST',{healthId,planName:'TEST plan',policyNumber:'TEST-001',coverageType:'Test',coverageLimit:100,deductible:0},201);policyId=policy.id;
    assert.equal((await expect('patient','/api/insurance')).plan.id,policyId);
    const claim=await expect('insurance','/api/insurance/claims','POST',{healthId,policyId,serviceType:'TEST service',amount:10},201);claimId=claim.id;
    await expect('insurance',`/api/insurance/claims/${claimId}/review`,'PATCH',{status:'approved',note:'Test review'});
    assert.equal((await pg.query('SELECT status FROM insurance_claims WHERE id=$1',[claimId])).rows[0].status,'approved');
  });
  await t.test('expired insurance consent hides policies and claims and blocks review',async()=>{
    await pg.query("UPDATE access_grants SET expires_at=now()-interval '1 minute' WHERE requester_id=$1",[users.insurance]);
    assert.deepEqual(await expect('insurance','/api/insurance/policies'),[]);assert.deepEqual(await expect('insurance','/api/insurance/claims'),[]);
    assert.equal((await call('insurance',`/api/insurance/claims/${claimId}/review`,'PATCH',{status:'paid'})).statusCode,403);
    await pg.query("UPDATE access_grants SET expires_at=now()+interval '1 day' WHERE requester_id=$1",[users.insurance]);
  });
  await t.test('support, privacy exports and notifications are linked to the correct user',async()=>{
    const ticket=await expect('patient','/api/support','POST',{category:'privacy_export',subject:'TEST request',body:'Test data request'},201);
    await expect('administrator','/api/support','PATCH',{id:ticket.id,body:'Test reply',status:'in_progress'});
    const thread=await expect('patient',`/api/support?id=${ticket.id}`);assert.equal(thread.messages.length,2);
    const exported=await expect('patient','/api/privacy-export');assert.ok(exported.records.some(row=>row.title==='TEST consultation'));
    assert.ok((await expect('patient','/api/app-notifications')).length>0);
    assert.ok((await expect('administrator','/api/admin/audit')).length>0);
  });
  await t.test('revoking consent prevents subsequent provider record access',async()=>{
    await pg.query("UPDATE access_grants SET status='revoked',revoked_at=now() WHERE requester_id=$1",[users.doctor]);
    assert.equal((await call('doctor','/api/records?grantId='+grantId)).statusCode,403);
  });
  await t.test('enrolled accounts require verified AAL2 for clinical APIs; recovery tickets do not bypass MFA',async()=>{
    await pg.query('UPDATE auth.users SET factors=$2 WHERE id=$1',[users.patient,JSON.stringify([{factor_type:'totp',status:'verified'}])]);
    assert.equal((await call('patient','/api/records')).statusCode,403);
    await expect('patient','/api/support','POST',{category:'mfa_recovery',subject:'TEST MFA recovery',body:'Test request'},201);
    assert.equal((await call('patient','/api/privacy-export')).statusCode,403);
    const original=tokens.patient;const aal2=`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({sub:users.patient,aal:'aal2'})).toString('base64url')}.verified-fixture`;
    db.sessions.set(aal2,users.patient);tokens.patient=aal2;await expect('patient','/api/records');tokens.patient=original;
    await pg.query("UPDATE auth.users SET factors='[]' WHERE id=$1",[users.patient]);
  });
});
