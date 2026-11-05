import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createDeliveryProvider} from '../server-api-handlers/delivery/providers.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const appUrl='https://wellnest-healthcare.vercel.app';
export function emailTestSettings(input){
  if(input.DELIVERY_ENABLED!=='false')throw new Error('Automatic sending must remain disabled during free email setup.');
  if(input.PUBLIC_APP_URL!==appUrl)throw new Error('Unexpected website address.');
  if(!/^re_[A-Za-z0-9_-]{16,}$/.test(input.RESEND_API_KEY||''))throw new Error('Add the Resend sending key privately to .env.services.local.');
  if(!['onboarding@resend.dev','WellNest <onboarding@resend.dev>'].includes(input.EMAIL_FROM))throw new Error('This setup uses only the free onboarding@resend.dev test sender.');
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(input.EMAIL_TEST_RECIPIENT||''))throw new Error('Set EMAIL_TEST_RECIPIENT to your own Resend account email.');
  return {RESEND_API_KEY:input.RESEND_API_KEY,EMAIL_FROM:input.EMAIL_FROM,PUBLIC_APP_URL:appUrl,DELIVERY_ENABLED:'false'};
}
const fingerprint=value=>createHash('sha256').update(value).digest('hex');
async function main(){
  const input={};
  for(const line of (await readFile(resolve(root,'.env.services.local'),'utf8')).split(/\r?\n/)){
    const match=line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/);if(match)input[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2');
  }
  const args=process.argv.slice(2);
  if(!args.includes('--send-test')&&!args.includes('--deploy-env')&&!args.includes('--check-test')){
    console.log(`Resend key: ${input.RESEND_API_KEY?'present (hidden)':'missing'}`);
    console.log(`Test sender: ${input.EMAIL_FROM?.includes('onboarding@resend.dev')?'prepared':'missing'}`);
    console.log(`Own test recipient: ${input.EMAIL_TEST_RECIPIENT?'prepared (hidden)':'missing'}`);
    console.log(`Automatic sending: ${input.DELIVERY_ENABLED==='false'?'disabled':'must be disabled'}`);return;
  }
  const settings=emailTestSettings(input);
  const stateDir=resolve(root,'node_modules/.tmp/email-setup');await mkdir(stateDir,{recursive:true});
  const receiptFile=resolve(stateDir,'last-test.json');
  if(args.includes('--check-test')){
    const receipt=JSON.parse(await readFile(receiptFile,'utf8'));
    if(!receipt.providerId||receipt.keyFingerprint!==fingerprint(settings.RESEND_API_KEY))throw new Error('No matching accepted test email is available to inspect.');
    const response=await fetch(`https://api.resend.com/emails/${encodeURIComponent(receipt.providerId)}`,{headers:{Authorization:`Bearer ${settings.RESEND_API_KEY}`},signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!response.ok)throw new Error(`Resend delivery lookup returned HTTP ${response.status}. Check the message in Resend's Emails dashboard; no additional email was sent.`);
    const data=await response.json();console.log(JSON.stringify({providerStatus:data.last_event||'not supplied',createdAt:data.created_at||null}));return;
  }
  if(args.includes('--send-test')){
    // One explicit test through the same adapter used by production. Never retry
    // an uncertain send automatically; check the inbox/provider first.
    const outcome=await createDeliveryProvider({env:settings})({channel:'email',to:input.EMAIL_TEST_RECIPIENT,id:randomUUID(),text:`This is your WellNest email setup test. Email is connected for testing. Automatic patient notifications remain disabled.\n\nOpen WellNest: ${appUrl}`});
    await writeFile(receiptFile,JSON.stringify({at:new Date().toISOString(),status:outcome.status,providerId:outcome.providerId||null,keyFingerprint:fingerprint(settings.RESEND_API_KEY),recipientFingerprint:fingerprint(input.EMAIL_TEST_RECIPIENT)},null,2));
    if(outcome.status!=='accepted')throw new Error(`Email test result: ${outcome.status} (${outcome.error||'not configured'}). Check your inbox before repeating an uncertain send.`);
    console.log('Resend accepted one WellNest test email. Confirm actual receipt in your own inbox. Automatic sending remains disabled.');return;
  }
  const receipt=JSON.parse(await readFile(receiptFile,'utf8').catch(()=>'{"status":"missing"}'));
  if(receipt.status!=='accepted'||receipt.keyFingerprint!==fingerprint(settings.RESEND_API_KEY)||receipt.recipientFingerprint!==fingerprint(input.EMAIL_TEST_RECIPIENT))throw new Error('Complete a successful test with these settings before saving them to Vercel.');
  if(!args.includes('--receipt-confirmed'))console.log('Owner inbox receipt is not yet confirmed. Only disabled email-test settings will be saved.');
  const packagePath=resolve(process.env.APPDATA||'','npm/node_modules/vercel/package.json');
  const pkg=JSON.parse(await readFile(packagePath,'utf8'));const cli=resolve(dirname(packagePath),typeof pkg.bin==='string'?pkg.bin:pkg.bin.vercel);
  for(const [name,value]of Object.entries(settings)){
    const cliArgs=[cli,'env','add',name,'production','--force','--yes',name==='RESEND_API_KEY'?'--sensitive':'--no-sensitive','--project','prj_B72AGxyT9y2BFXeXLMVZ86o3ix2V','--scope','smitpatil1959-1013s-projects','--no-color'];
    const code=await new Promise((done,reject)=>{
      const child=spawn(process.execPath,cliArgs,{cwd:root,stdio:['pipe','ignore','ignore'],windowsHide:true});
      child.once('error',()=>reject(new Error(`Could not start secure settings update for ${name}.`)));child.once('exit',done);child.stdin.on('error',()=>{});child.stdin.end(value);
    });
    if(code!==0)throw new Error(`Saving ${name} failed (CLI exit ${code}). The secret value was not printed.`);
    console.log(`Saved ${name} to the existing production project${name==='RESEND_API_KEY'?' as a protected secret':''}.`);
  }
  console.log('Email settings saved. Redeploy the existing site to load them. SMS and scheduler settings were not changed.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
