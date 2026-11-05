import http from 'node:http';
import net from 'node:net';
import { createHash, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function scanWithClamd(bytes,{host='clamav',port=3310,timeout=20000}={}) {
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection({host,port});let response='';
    const fail=error=>{socket.destroy();reject(error);};
    socket.setTimeout(timeout,()=>fail(new Error('Scanner timed out')));
    socket.on('error',fail);socket.on('data',chunk=>{response+=chunk.toString('utf8');if(response.length>8192)fail(new Error('Invalid scanner response'));});
    socket.on('end',()=>{if(/: OK\x00?$/.test(response.trim()))resolve('clean');else if(/ FOUND(?:\x00)?\s*$/.test(response))resolve('infected');else reject(new Error('Scanner did not produce a verdict'));});
    socket.on('connect',()=>{
      socket.write('zINSTREAM\0');
      for(let offset=0;offset<bytes.length;offset+=65536){const chunk=bytes.subarray(offset,offset+65536);const length=Buffer.alloc(4);length.writeUInt32BE(chunk.length);socket.write(length);socket.write(chunk);}
      socket.write(Buffer.alloc(4));
    });
  });
}
export function createScannerServer({token,scan=scanWithClamd,maxBytes=3*1024*1024}={}) {
  if(!token||token.length<32)throw new Error('Set a scanner API token of at least 32 characters');
  return http.createServer(async(req,res)=>{
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    const presented=Buffer.from(req.headers.authorization||'');const expected=Buffer.from('Bearer '+token);
    if(presented.length!==expected.length||!timingSafeEqual(presented,expected)){res.writeHead(401);res.end('{"error":"Unauthorized"}');return;}
    if(req.url!=='/scan'||req.method!=='POST'){res.writeHead(404);res.end('{"error":"Not found"}');return;}
    if(req.headers['content-type']!=='application/octet-stream'){res.writeHead(415);res.end('{"error":"Binary body required"}');return;}
    try {
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>maxBytes){res.writeHead(413);res.end('{"error":"File too large"}');return;}chunks.push(chunk);}
      if(!size){res.writeHead(400);res.end('{"error":"Empty file"}');return;}
      const bytes=Buffer.concat(chunks);const status=await scan(bytes);
      if(!['clean','infected'].includes(status))throw new Error('Invalid verdict');
      res.end(JSON.stringify({status,sha256:createHash('sha256').update(bytes).digest('hex'),scannerName:'clamav-private',scannedAt:new Date().toISOString()}));
    }catch{res.writeHead(503);res.end('{"error":"Scanner unavailable"}');}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createScannerServer({token:process.env.SCAN_API_TOKEN,scan:bytes=>scanWithClamd(bytes,{host:process.env.CLAMD_HOST||'clamav',port:Number(process.env.CLAMD_PORT||3310)})});
  server.listen(Number(process.env.PORT||8080),'0.0.0.0');
}
