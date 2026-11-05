import {useState} from 'react';
import supabase from '../../lib/supabase';
import {useAuth} from '../../providers/AuthProvider';
import {Input} from '../ui/Input';
import {Button} from '../ui/Button';
import {Alert} from '../ui/Alert';
export function PhoneVerification(){
  const {user,refreshProfile}=useAuth();const [phone,setPhone]=useState(user?.phone||'');const [code,setCode]=useState('');const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <div className="mt-5 border-t border-line pt-5"><h3 className="text-sm font-semibold">Verified mobile number</h3><p className="mt-2 text-xs leading-6 text-ink-500">SMS reminders require an opted-in, verified number. Your operator must configure SMS delivery and phone verification first.</p>{user?.phone_confirmed_at&&<p className="mt-2 text-sm text-brand-700">Verified: {user.phone}</p>}{error&&<Alert tone="error" title="Phone verification unavailable" className="my-3">{error}</Alert>}
    <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');try{if(sent){const result=await supabase.auth.verifyOtp({phone,token:code,type:'phone_change'});if(result.error)throw result.error;await refreshProfile();setSent(false);setCode('');}else{if(!/^\+[1-9]\d{7,14}$/.test(phone))throw new Error('Use an international number, such as +91 followed by your number.');const result=await supabase.auth.updateUser({phone});if(result.error)throw result.error;setSent(true);}}catch(failure){setError(failure instanceof Error?failure.message:'Verification could not be completed.');}finally{setBusy(false);}}}>
      <Input required label="Mobile number" type="tel" autoComplete="tel" value={phone} disabled={sent} onChange={event=>setPhone(event.target.value)}/>{sent&&<Input required label="SMS verification code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event=>setCode(event.target.value)}/>}<Button type="submit" size="sm" variant="outline" loading={busy}>{sent?'Verify code':'Send verification code'}</Button>{sent&&<button type="button" className="text-xs underline" onClick={()=>setSent(false)}>Change number</button>}
    </form></div>;
}
