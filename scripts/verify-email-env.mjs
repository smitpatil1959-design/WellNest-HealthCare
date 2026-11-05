// Run through `vercel env run`; never print values or load the local secret file.
const checks={
  senderMatches:process.env.EMAIL_FROM==='WellNest <onboarding@resend.dev>',
  websiteMatches:process.env.PUBLIC_APP_URL==='https://wellnest-healthcare.vercel.app',
  clientWebsiteMatches:process.env.VITE_APP_URL==='https://wellnest-healthcare.vercel.app',
  automaticSendingDisabled:process.env.DELIVERY_ENABLED==='false',
};
console.log(JSON.stringify(checks));
if(Object.values(checks).some(value=>!value))process.exitCode=1;
