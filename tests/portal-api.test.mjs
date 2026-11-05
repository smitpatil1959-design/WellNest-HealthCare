import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHospitalHandler } from '../server-api-handlers/hospital/entries.js';
import { createInventoryHandler } from '../server-api-handlers/pharmacy/inventory.js';
import { createAdminUsersHandler } from '../server-api-handlers/admin/users.js';
import { validateHospitalPayload, canWriteHospital } from '../server-api-handlers/hospital/model.js';
import { validateInventory } from '../server-api-handlers/pharmacy/inventory.js';
import { createAppointmentsHandler, validAppointmentTime } from '../server-api-handlers/appointments.js';

function fakeDb(results = []) {
  const calls = [];
  return { calls, from(table) {
    const call={table,filters:[],operation:'read'}; calls.push(call);
    const chain = new Proxy({}, { get(_, key) {
      if (key === 'then') return (resolve,reject) => Promise.resolve(results.shift() || { data: [], error: null }).then(resolve,reject);
      return (...args) => { if(['insert','update'].includes(key)) call.operation=key; call.filters.push([key,...args]); return chain; };
    }}); return chain;
  }, async rpc(name,args) { calls.push({rpc:name,args}); return results.shift() || {data:{id:'saved',payload:args.p_payload,version:1},error:null}; } };
}
const staff = { authenticated:true,role:'hospital',roleVerified:true,userId:'staff',fullName:'Care team' };
const context = (role,kind='hospital') => ({membership:{role},organization:{id:'own-org',kind}});
async function call(handler,method,body) {
  const res={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this;},json(data){this.body=data;return this;},end(){return this;}};
  await handler({method,body,headers:{}},res); return res;
}
test('hospital endpoints reject unauthenticated and unverified accounts before reading data',async()=>{
  for(const auth of [{authenticated:false}, {...staff,roleVerified:false}, {...staff,role:'patient'}]) {
    const db=fakeDb(); const handler=createHospitalHandler({db,authenticate:async()=>auth});
    assert.ok([401,403].includes((await call(handler,'GET')).statusCode)); assert.equal(db.calls.length,0);
  }
});
test('hospital reads are scoped to server-derived organization and membership capabilities',async()=>{
  const db=fakeDb(); const handler=createHospitalHandler({db,authenticate:async()=>staff,membership:async()=>context('hospital_receptionist')});
  assert.equal((await call(handler,'GET')).statusCode,200);
  assert.ok(db.calls[0].filters.some(([op,key,value])=>op==='eq'&&key==='organization_id'&&value==='own-org'));
  const allowed=db.calls[0].filters.find(([op])=>op==='in')[2]; assert.equal(allowed.includes('consults'),false);
});
test('browser role and organization values cannot authorize a clinical write',async()=>{
  const db=fakeDb(); const handler=createHospitalHandler({db,authenticate:async()=>staff,membership:async()=>context('hospital_receptionist')});
  const result=await call(handler,'POST',{kind:'consults',role:'hospital_admin',organizationId:'other-org',payload:{patientId:'someone',diagnosis:'Test'}});
  assert.equal(result.statusCode,403); assert.equal(db.calls.length,0);
});
test('a record from another hospital cannot be updated by guessing its ID',async()=>{
  const db=fakeDb([{data:null,error:null}]); const handler=createHospitalHandler({db,authenticate:async()=>staff,membership:async()=>context('hospital_admin')});
  const result=await call(handler,'PATCH',{kind:'patients',id:'other-entry',version:1,payload:{name:'Test',dob:'2000-01-01'}});
  assert.equal(result.statusCode,404); assert.equal(db.calls.some(call=>call.rpc),false);
});
test('linked patient identity requires active patient consent',async()=>{
  const db=fakeDb([{data:[],error:null},{data:{user_id:'patient',health_id:'VY-TEST-TEST'},error:null}]);
  const handler=createHospitalHandler({db,authenticate:async()=>staff,membership:async()=>context('hospital_admin'),findGrant:async()=>null});
  const result=await call(handler,'POST',{kind:'patients',payload:{name:'Test',dob:'2000-01-01',healthId:'VY-TEST-TEST',patientUserId:'forged'}});
  assert.equal(result.statusCode,403); assert.equal(db.calls.some(call=>call.rpc),false);
});
test('hospital registration ignores forged patient IDs, MRNs and organization fields',async()=>{
  const db=fakeDb([{data:[],error:null}]); const handler=createHospitalHandler({db,authenticate:async()=>staff,membership:async()=>context('hospital_admin')});
  const result=await call(handler,'POST',{kind:'patients',organizationId:'forged',payload:{name:'Test',dob:'2000-01-01',patientUserId:'forged',mrn:'forged'}});
  assert.equal(result.statusCode,201); const mutation=db.calls.find(call=>call.rpc);
  assert.equal(mutation.args.p_organization,'own-org'); assert.equal(mutation.args.p_payload.patientUserId,undefined); assert.match(mutation.args.p_payload.mrn,/^WN-/);
});
test('pharmacy cashiers cannot access inventory and technicians cannot change it',async()=>{
  for(const [role,method] of [['pharmacy_cashier','GET'],['pharmacy_technician','PATCH']]) {
    const db=fakeDb(); const handler=createInventoryHandler({db,authenticate:async()=>({...staff,role:'pharmacy'}),membership:async(auth,allowed)=>allowed.includes(role)?context(role,'pharmacy'):null});
    assert.equal((await call(handler,method,{id:'stock',version:1,onHand:5})).statusCode,403); assert.equal(db.calls.length,0);
  }
});
test('pharmacy stock adjustments use organization and version checks',async()=>{
  const db=fakeDb([{data:null,error:null}]); const handler=createInventoryHandler({db,authenticate:async()=>({...staff,role:'pharmacy'}),membership:async()=>context('pharmacist','pharmacy')});
  assert.equal((await call(handler,'PATCH',{id:'stock',version:3,onHand:12,organizationId:'forged'})).statusCode,409);
  assert.ok(db.calls[0].filters.some(([op,key,value])=>op==='eq'&&key==='organization_id'&&value==='own-org'));
  assert.ok(db.calls[0].filters.some(([op,key,value])=>op==='eq'&&key==='version'&&value===3));
});
test('invalid and fractional stock cannot be stored',()=>{
  const valid={name:'Test medicine',sku:'TEST',form:'Tablet',strength:'Test',lot:'LOT',expires:'2028-01-01',onHand:10,reorder:2,controlled:false};
  assert.equal(validateInventory(valid).on_hand,10);
  for(const onHand of [-1,1.5,NaN,Infinity,'12']) assert.throws(()=>validateInventory({...valid,onHand}));
});
test('hospital validation rejects invalid dates and strips claims of verification',()=>{
  assert.throws(()=>validateHospitalPayload('patients',{name:'Test',dob:'2025-02-30'}));
  const report=validateHospitalPayload('reports',{patientId:'chart',title:'Test',date:'2026-11-04',verified:true,uploader:'forged'});
  assert.equal(report.verified,undefined); assert.equal(report.uploader,undefined);
  assert.equal(canWriteHospital('hospital_receptionist','discharges'),false);
});
test('administrator endpoint cannot be used by patients or suspend the current administrator',async()=>{
  const db=fakeDb();
  const nonAdmin=createAdminUsersHandler({db,authenticate:async()=>({...staff,role:'patient'})});
  assert.equal((await call(nonAdmin,'GET')).statusCode,403);
  const admin=createAdminUsersHandler({db,authenticate:async()=>({...staff,role:'administrator'})});
  assert.equal((await call(admin,'PATCH',{id:'staff',status:'suspended'})).statusCode,400);
  assert.equal(db.calls.length,0);
});
test('patient cancellation is limited to their own upcoming appointment',async()=>{
  const db=fakeDb([{data:{id:'visit',status:'canceled'},error:null}]);
  const handler=createAppointmentsHandler({database:db,authenticate:async()=>({...staff,role:'patient',userId:'patient'})});
  assert.equal((await call(handler,'PATCH',{id:'visit',action:'cancel',patient_id:'someone-else'})).statusCode,200);
  assert.ok(db.calls[0].filters.some(([op,key,value])=>op==='eq'&&key==='patient_id'&&value==='patient'));
  assert.ok(db.calls[0].filters.some(([op,key,value])=>op==='eq'&&key==='status'&&value==='upcoming'));
});
test('rescheduling rejects occupied slots without reporting success',async()=>{
  const db=fakeDb([{data:{id:'visit',doctor_id:'doctor'},error:null},{data:{enabled:false},error:null},{data:null,error:{code:'23505'}}]);
  const handler=createAppointmentsHandler({database:db,authenticate:async()=>({...staff,role:'patient'})});
  assert.equal((await call(handler,'PATCH',{id:'visit',action:'reschedule',date:'2099-01-01',time:'09:00'})).statusCode,409);
});
test('booking rejects invalid calendar dates and malformed times',()=>{
  assert.equal(validAppointmentTime('2099-02-30','09:00'),false);
  assert.equal(validAppointmentTime('2099-01-01','25:00'),false);
  assert.equal(validAppointmentTime('2000-01-01','09:00'),false);
  assert.equal(validAppointmentTime('2099-01-01','09:00'),true);
});
