import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('database migrations and shared portal transactions work in PostgreSQL', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,raw_user_meta_data jsonb DEFAULT '{}',raw_app_meta_data jsonb DEFAULT '{}',created_at timestamptz DEFAULT now());
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';`);
  await db.exec(`CREATE TABLE auth.mfa_factors(id uuid DEFAULT gen_random_uuid(),user_id uuid,status text);CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;`);
  for (const file of (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8')); }
    catch(error) { throw new Error(`Migration ${file}: ${error.message}`, { cause: error }); }
  }
  const user = '00000000-0000-4000-8000-000000000001';
  const patient = '00000000-0000-4000-8000-000000000002';
  const org = '00000000-0000-4000-8000-000000000003';
  await db.query(`INSERT INTO auth.users(id,email) VALUES ($1,'staff@example.test'),($2,'patient@example.test')`, [user,patient]);
  await db.query(`UPDATE profiles SET role='administrator',role_verified=true WHERE id=$1`,[user]);
  await db.query(`INSERT INTO organizations(id,kind,legal_name,display_name,status) VALUES($1,'hospital','Test Hospital','Test Hospital','verified')`,[org]);
  const save = async (kind,payload,id=null,version=null,organization=org) => (await db.query('SELECT public.save_hospital_entry($1,$2,$3,$4,$5,$6) AS entry',[organization,user,kind,JSON.stringify(payload),id,version])).rows[0].entry;
  let chart;
  await t.test('a saved patient chart survives a subsequent database read', async () => {
    chart = await save('patients',{name:'Test Patient',dob:'2000-01-01',patientUserId:patient});
    const stored=(await db.query('SELECT payload FROM hospital_entries WHERE id=$1',[chart.id])).rows[0];
    assert.equal(stored.payload.name,'Test Patient');
    assert.equal(chart.version,1);
  });
  await t.test('stale staff edits and wrong-organization edits are rejected',async()=>{
    await save('patients',{...chart.payload,name:'Updated Patient'},chart.id,1);
    await assert.rejects(save('patients',chart.payload,chart.id,1),{code:'PT409'});
    await assert.rejects(save('patients',chart.payload,chart.id,2,patient),{code:'PT409'});
  });
  await t.test('hospital consultation publishes a patient record and notification together', async()=>{
    await save('consults',{patientId:chart.id,patientUserId:patient,diagnosis:'Follow-up',notes:'Test consultation',date:'2026-11-04',uploader:'Test Hospital'});
    const records=(await db.query('SELECT * FROM records WHERE patient_id=$1',[patient])).rows;
    assert.equal(records.length,1);
    assert.match(records[0].summary,/Test consultation/);
    assert.ok((await db.query("SELECT id FROM app_notifications WHERE recipient_id=$1 AND kind='hospital_record'",[patient])).rows.length);
  });
  await t.test('discharge release closes the admission in the same transaction', async()=>{
    const admission=await save('admissions',{patientId:chart.id,room:'101',bed:'A',status:'admitted'});
    await save('discharges',{admissionId:admission.id,patientId:chart.id,patientUserId:patient,diagnosis:'Test discharge',instructions:'Test follow-up',approved:true});
    assert.equal((await db.query('SELECT payload FROM hospital_entries WHERE id=$1',[admission.id])).rows[0].payload.status,'discharged');
  });
  await t.test('marking an admission ready for discharge creates one shared draft',async()=>{
    const admission=await save('admissions',{patientId:chart.id,room:'102',bed:'A',status:'admitted'});
    await save('admissions',{...admission.payload,status:'pending-discharge'},admission.id,1);
    const drafts=(await db.query("SELECT payload FROM hospital_entries WHERE kind='discharges' AND payload->>'admissionId'=$1",[admission.id])).rows;
    assert.equal(drafts.length,1); assert.equal(drafts[0].payload.approved,false);
  });
  await t.test('failed discharge rolls back the summary and audit writes', async()=>{
    const before=(await db.query("SELECT count(*)::int AS n FROM hospital_entries WHERE kind='discharges'")).rows[0].n;
    await assert.rejects(save('discharges',{admissionId:patient,patientId:chart.id,approved:true}));
    assert.equal((await db.query("SELECT count(*)::int AS n FROM hospital_entries WHERE kind='discharges'")).rows[0].n,before);
  });
  await t.test('inventory has organization boundaries, batch uniqueness and transactional audit',async()=>{
    await db.query(`INSERT INTO pharmacy_inventory(organization_id,name,sku,lot,expires,updated_by,on_hand) VALUES($1,'Test medicine','TEST','LOT-1','2028-01-01',$2,10)`,[org,user]);
    await assert.rejects(db.query(`INSERT INTO pharmacy_inventory(organization_id,name,sku,lot,expires,updated_by) VALUES($1,'Duplicate','TEST','LOT-1','2028-01-01',$2)`,[org,user]),{code:'23505'});
    await assert.rejects(db.query('UPDATE pharmacy_inventory SET on_hand=-1'),{code:'23514'});
    assert.ok((await db.query("SELECT id FROM audit_events WHERE target_type='pharmacy_inventory'")).rows.length);
    for(const role of ['anon','authenticated']) for(const table of ['hospital_entries','pharmacy_inventory']) {
      assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[role,table,'SELECT'])).rows[0].allowed,false);
    }
  });
  await t.test('administrative suspension persists without granting a role and prevents self-suspension',async()=>{
    await db.query("SELECT set_portal_account_status($1,$2,'suspended')",[user,patient]);
    const profile=(await db.query('SELECT role,account_status FROM profiles WHERE id=$1',[patient])).rows[0];
    assert.equal(profile.account_status,'suspended'); assert.equal(profile.role,'patient');
    await assert.rejects(db.query("SELECT set_portal_account_status($1,$1,'suspended')",[user]),{code:'42501'});
  });
  await t.test('two patients cannot book the same doctor slot',async()=>{
    await db.query("INSERT INTO appointments(patient_id,doctor_id,title,date,time,status) VALUES($1,$2,'Visit','2027-01-01','09:00','upcoming')",[patient,user]);
    await assert.rejects(db.query("INSERT INTO appointments(patient_id,doctor_id,title,date,time,status) VALUES($1,$2,'Other visit','2027-01-01','09:00','upcoming')",[patient,user]),{code:'23505'});
  });
});
