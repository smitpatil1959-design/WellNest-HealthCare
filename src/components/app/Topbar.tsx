import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Menu, Search, Siren } from 'lucide-react';
import { NotificationCenter } from '../chrome/NotificationCenter';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../providers/AuthProvider';
import { useUI } from '../../providers/UIProvider';
import { portalTheme } from '../../config/portal';
import { appNavByRole } from '../../config/appNav';
import { paths } from '../../routes/paths';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, profile, role } = useAuth();
  const { setCommandOpen } = useUI();
  const location = useLocation();
  const displayName = profile?.fullName || (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Member';
  const current = role ? [...appNavByRole[role]].sort((a,b) => b.href.length - a.href.length).find(item => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)) : null;
  const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', weekday: 'short', timeZone: 'Asia/Kolkata' }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-[#dfe5d5] bg-[#f8f8f2]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenu} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d8e0ce] text-[#244c3d] lg:hidden" aria-label="Open navigation"><Menu size={19} /></button>
        <div className="min-w-0"><p className="truncate text-[8px] font-medium uppercase tracking-[1.7px] text-[#879477]">{role ? portalTheme[role].eyebrow : 'Connected care'}</p><p className="mt-1 truncate text-[13px] font-semibold text-[#284c37]">{current?.label === 'Command' || current?.label === 'Control' ? 'Overview' : current?.label || (location.pathname === paths.app.profile ? 'Your profile' : location.pathname === paths.app.settings ? 'Your settings' : 'Your workspace')}</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="mr-2 hidden items-center gap-2 text-[10px] text-[#76866c] xl:flex"><CalendarDays size={14} />{date}</span>
        <button type="button" onClick={() => setCommandOpen(true)} className="flex size-10 items-center justify-center gap-3 rounded-full border border-[#d8e0ce] bg-white/60 text-[#718066] transition hover:border-[#aabc97] sm:w-auto sm:px-4" aria-label="Search workspace"><Search size={15} /><span className="hidden text-[11px] sm:inline">Find a page...</span><kbd className="hidden text-[9px] text-[#94a087] md:inline">Ctrl K</kbd></button>
        <NotificationCenter />
        {role === 'patient' && <Link to={paths.app.patientEmergency} className="flex size-9 items-center justify-center rounded-full bg-[#f4e4db] text-[#aa6448] transition hover:bg-[#edcfbc]" aria-label="Emergency access"><Siren size={16} /></Link>}
        <Link to={paths.app.profile} className="ml-1 rounded-full ring-[#b7c6a6] ring-offset-2 transition hover:ring-2" aria-label={`Your profile, ${displayName}`}><Avatar name={displayName} src={profile?.avatarUrl || undefined} size="sm" /></Link>
        <Link to={role === 'patient' ? paths.app.patientHelp : paths.contact} className="hidden items-center gap-1 text-[10px] text-[#6e7e62] 2xl:flex">Need a hand?<ArrowUpRight size={12} /></Link>
      </div>
    </header>
  );
}
