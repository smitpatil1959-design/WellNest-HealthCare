import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertOwnedUser} from '../scripts/live-demo-qa.mjs';

test('live cleanup rejects existing accounts and mismatched run ownership',()=>{
  const run='f15aaf0b-f4d9-4073-9286-403a43206485',id='fc4bb7df-3b26-4dbb-a9c0-6aa242e3f899';
  const owned={id,email:'temporary@example.test',user_metadata:{qa_run_id:run,qa_temporary:true}};
  assert.doesNotThrow(()=>assertOwnedUser(owned,run,id));
  assert.throws(()=>assertOwnedUser({...owned,user_metadata:{}},run,id));
  assert.throws(()=>assertOwnedUser({...owned,user_metadata:{qa_run_id:'another-run',qa_temporary:true}},run,id));
  assert.throws(()=>assertOwnedUser({...owned,email:'existing@gmail.com'},run,id));
  assert.throws(()=>assertOwnedUser(owned,run,'another-user'));
  assert.throws(()=>assertOwnedUser(owned,'../../escape',id));
});
