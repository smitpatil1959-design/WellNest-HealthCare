import {test} from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {requiresSecondFactor} from '../shared/mfa.js';
import {createMalwareScanner,matchesFileType,requireCleanScan} from '../server-api-handlers/storage/malware-scanner.js';
import {createScannerServer,scanWithClamd} from '../services/file-scanner/server.mjs';
import {createDeliveryProvider,providerConfiguration} from '../server-api-handlers/delivery/providers.js';

test('verified factors require the same authenticated user at AAL2',()=>{
  const user={id:'user',factors:[{status:'verified',factor_type:'totp'}]};
  assert.equal(requiresSecondFactor(user,{sub:'user',aal:'aal1'}),true);
  assert.equal(requiresSecondFactor(user,{sub:'other',aal:'aal2'}),true);
  assert.equal(requiresSecondFactor(user,null),true);
  assert.equal(requiresSecondFactor(user,{sub:'user',aal:'aal2'}),false);
  assert.equal(requiresSecondFactor({id:'user',factors:[{status:'unverified'}]},{sub:'user',aal:'aal1'}),false);
});
test('pending, quarantined and failed scans cannot release a file',async()=>{
  for(const state of ['pending','quarantined','error',null,undefined])assert.throws(()=>requireCleanScan(state),{code:'FILE_SCAN_PENDING'});
  assert.doesNotThrow(()=>requireCleanScan('clean'));
  assert.equal((await createMalwareScanner()({content:Buffer.from('fixture')})).status,'pending');
  const content=Buffer.from('%PDF-1.7 fixture');
  const bad=createMalwareScanner({url:'https://scanner.example.test/scan',token:'test',fetchImpl:async()=>new Response(JSON.stringify({status:'clean',sha256:'wrong',scannedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}})});
  assert.equal((await bad({content})).status,'error');
  assert.equal(matchesFileType(content,'application/pdf'),true);
  assert.equal(matchesFileType(Buffer.from('not a pdf'),'application/pdf'),false);
});
test('private scanner gateway streams exact bytes to ClamAV and returns a bound verdict',async t=>{
  let received;
  const clam=net.createServer(socket=>{let buffered=Buffer.alloc(0);socket.on('data',chunk=>{buffered=Buffer.concat([buffered,chunk]);if(buffered.length<10)return;const length=buffered.readUInt32BE(10);if(buffered.length<14+length+4)return;assert.equal(buffered.subarray(0,10).toString(),'zINSTREAM\0');received=buffered.subarray(14,14+length);socket.end('stream: OK\0');});});
  clam.listen(0,'127.0.0.1');await once(clam,'listening');t.after(()=>clam.close());
  const token='private-test-token-with-more-than-32-characters';
  const gateway=createScannerServer({token,scan:bytes=>scanWithClamd(bytes,{host:'127.0.0.1',port:clam.address().port})});gateway.listen(0,'127.0.0.1');await once(gateway,'listening');t.after(()=>gateway.close());
  const url=`http://127.0.0.1:${gateway.address().port}/scan`,content=Buffer.from('%PDF-1.7 test file');
  let resultBody;
  const scanner=createMalwareScanner({url,token,allowInsecureForTests:true,fetchImpl:async(...args)=>{try{const response=await fetch(...args);resultBody={status:response.status,body:await response.clone().text()};return response;}catch(error){resultBody={error:error.message,cause:error.cause?.message};throw error;}}});assert.equal((await scanner({content})).status,'clean',JSON.stringify(resultBody));assert.deepEqual(received,content);
  assert.equal((await fetch(url,{method:'POST',body:content})).status,401);
  const untrusted=createMalwareScanner({url,token});assert.equal((await untrusted({content})).status,'error');
});
test('private scan adapter quarantines a positive verdict and fails closed on outages',async()=>{
  const content=Buffer.from('test fixture');
  const positive=createMalwareScanner({url:'https://scanner.example.test/scan',token:'test',fetchImpl:async()=>new Response(JSON.stringify({status:'infected',sha256:createHash('sha256').update(content).digest('hex'),scannedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}})});
  assert.equal((await positive({content})).status,'quarantined');
  const unavailable=createMalwareScanner({url:'https://scanner.example.test/scan',token:'test',fetchImpl:async()=>{throw new Error('offline');}});
  assert.equal((await unavailable({content})).status,'error');
});
test('unconfigured providers do not send or report delivery',async()=>{
  assert.deepEqual(providerConfiguration({}),{email:false,sms:false,enabled:false});let called=false;
  const send=createDeliveryProvider({env:{},fetchImpl:async()=>{called=true;}});assert.equal((await send({channel:'email',to:'test@example.test',id:'job',text:'Test'})).status,'not_configured');assert.equal(called,false);
});
test('email adapter uses a stable idempotency key and records acceptance rather than delivery',async()=>{
  let captured;
  const send=createDeliveryProvider({env:{RESEND_API_KEY:'test',EMAIL_FROM:'WellNest <no-reply@example.test>'},fetchImpl:async(url,options)=>{captured={url,options};return new Response(JSON.stringify({id:'receipt'}),{status:200});}});
  const result=await send({channel:'email',to:'test@example.test',id:'job-1',text:'Generic update'});
  assert.equal(result.status,'accepted');assert.equal(captured.options.headers['Idempotency-Key'],'wellnest-job-1');assert.equal(JSON.parse(captured.options.body).text,'Generic update');
});
test('SMS adapter requires an international recipient and treats unknown responses as uncertain',async()=>{
  let calls=0;const env={TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),TWILIO_AUTH_TOKEN:'test',TWILIO_FROM:'+15555550100'};
  const send=createDeliveryProvider({env,fetchImpl:async()=>{calls++;throw new Error('timeout');}});
  assert.equal((await send({channel:'sms',to:'5555',id:'job',text:'Test'})).status,'failed');assert.equal(calls,0);
  assert.equal((await send({channel:'sms',to:'+15555550101',id:'job',text:'Test'})).status,'uncertain');
});
