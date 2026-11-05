// Manual local integration check. Requires a real clamd on loopback port 33317.
// Does not upload files to WellNest or change production settings.
import assert from 'node:assert/strict';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {createScannerServer,scanWithClamd} from './server.mjs';
import {createMalwareScanner,requireCleanScan} from '../../server-api-handlers/storage/malware-scanner.js';

const host='127.0.0.1',port=33317;
const ping=()=>new Promise((resolve,reject)=>{
  const socket=net.createConnection({host,port});let response='';
  socket.setTimeout(1000,()=>socket.destroy(new Error('Scanner not ready')));
  socket.on('error',reject);socket.on('data',chunk=>response+=chunk.toString());
  socket.on('end',()=>response.includes('PONG')?resolve():reject(new Error('Scanner not ready')));
  socket.on('connect',()=>socket.end('zPING\0'));
});
const deadline=Date.now()+90000;
while(true){try{await ping();break;}catch(error){if(Date.now()>deadline)throw error;await new Promise(resolve=>setTimeout(resolve,500));}}
const token=randomBytes(32).toString('hex');
const server=createScannerServer({token,scan:bytes=>scanWithClamd(bytes,{host,port})});
await new Promise(resolve=>server.listen(0,host,resolve));
const url=`http://${host}:${server.address().port}/scan`;
const scan=createMalwareScanner({url,token,allowInsecureForTests:true});
try{
  const clean=await scan({content:Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF')});
  assert.equal(clean.status,'clean');requireCleanScan(clean.status);
  // Standard harmless EICAR test bytes, sent directly to the local engine.
  const eicar=Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$'+'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
  assert.equal(eicar.length,68);
  const detected=await scan({content:eicar});assert.equal(detected.status,'quarantined');
  assert.throws(()=>requireCleanScan(detected.status));
  const unauthorized=await fetch(url,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:Buffer.from('synthetic test')});
  assert.equal(unauthorized.status,401);
  console.log(JSON.stringify({environment:'isolated local real ClamAV engine',cleanFile:clean.status,eicar:detected.status,quarantinedRelease:'blocked',unauthenticatedGateway:unauthorized.status,productionConfigured:false}));
}finally{await new Promise(resolve=>server.close(resolve));}
const unavailable=await scan({content:Buffer.from('synthetic test')});
assert.equal(unavailable.status,'error');assert.throws(()=>requireCleanScan(unavailable.status));
console.log('Scanner outage fails closed. Local integration check passed.');
