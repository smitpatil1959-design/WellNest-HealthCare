import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

test('database conflicts return promptly without triggering an unrelated restore service',async()=>{
  const script=`
    import assert from 'node:assert/strict';
    process.env.SUPABASE_URL='https://qa-project.example.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-server-key';
    process.env.FULLSTACK_PROJECT_REF='legacy-project';
    process.env.FULLSTACK_RESTORE_API_URL='https://legacy-restore.example.test';
    const requests=[];
    globalThis.fetch=async(url)=>{requests.push(String(url));return new Response(JSON.stringify({code:'40001',message:'Slot already reserved'}),{status:500,headers:{'Content-Type':'application/json'}});};
    const {default:db}=await import('./server-api-handlers/db-client.js');
    const response=await db.rpc('book_appointment_slot',{});
    assert.equal(response.error.code,'40001');
    assert.deepEqual(requests,['https://qa-project.example.test/rest/v1/rpc/book_appointment_slot']);
  `;
  const result=await promisify(execFile)(process.execPath,['--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),timeout:5000});
  assert.equal(result.stderr,'');
});
