import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { StatMetricCard } from '../../components/ui/StatMetricCard';
import { useAdminPortal } from '../../hooks/useAdminPortal';

export default function AdminAnalyticsPage() {
  const {users,orgs,audit}=useAdminPortal();
  const roles=['patient','doctor','hospital','laboratory','pharmacy','insurance','administrator'];
  const months=Array.from({length:6},(_,index)=>{const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-5+index);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;return {label:date.toLocaleDateString(undefined,{month:'short',year:'2-digit'}),count:users.filter(user=>user.created.startsWith(key)).length};});
  const maximum=Math.max(1,...months.map(month=>month.count));
  return <><Seo title="Platform analytics" description="Account and organization counts from saved platform data." /><PatientPageHeader title="Platform analytics" description="Counts are calculated from registered accounts, organizations and the latest recorded audit events." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatMetricCard label="Registered accounts" value={users.length}/><StatMetricCard label="Verified organizations" value={orgs.filter(org=>org.status==='verified').length}/><StatMetricCard label="Recorded denials" value={audit.filter(event=>event.result==='denied').length} detail="Within the latest 500 audit events"/></div>
    <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="font-display text-2xl">Accounts by role</h2><div className="mt-5 space-y-3">{roles.map(role=><div key={role} className="flex justify-between border-b border-line pb-2 text-sm"><span className="capitalize">{role}</span><strong>{users.filter(user=>user.role===role).length}</strong></div>)}</div></Card><Card><h2 className="font-display text-2xl">Account registrations</h2><div className="mt-6 space-y-4">{months.map(month=><div key={month.label}><div className="mb-1 flex justify-between text-xs"><span>{month.label}</span><strong>{month.count}</strong></div><div className="h-3 rounded-full bg-brand-50"><div className="h-full rounded-full bg-brand-600" style={{width:`${month.count/maximum*100}%`}}/></div></div>)}</div></Card></div>
  </>;
}
