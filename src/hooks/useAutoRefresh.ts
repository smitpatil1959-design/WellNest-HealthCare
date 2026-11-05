import {useEffect} from 'react';
// API-backed workspaces refresh while visible and immediately when the user returns.
export function useAutoRefresh(refresh:()=>Promise<unknown>,enabled=true){
  useEffect(()=>{
    if(!enabled)return;
    let running=false;let stopped=false;
    const update=async()=>{if(stopped||running||document.visibilityState!=='visible')return;running=true;try{await refresh();}catch{/* The workspace request state reports the failure. */}finally{running=false;}};
    const timer=window.setInterval(()=>void update(),15000);
    const onVisible=()=>void update();window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
    return()=>{stopped=true;window.clearInterval(timer);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);};
  },[refresh,enabled]);
}
