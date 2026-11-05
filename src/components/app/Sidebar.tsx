import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  CircleHelp,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Pill,
  Settings,
  Shield,
  Siren,
  Syringe,
  Users,
  ArrowUpRight,
  LogOut,
  LoaderCircle,
} from 'lucide-react';
import { LandingBrand } from '../../pages/landing/LandingChrome';
import { Avatar } from '../ui/Avatar';
import { accountNav, appNavByRole, type AppNavItem } from '../../config/appNav';
import { useAuth } from '../../providers/AuthProvider';
import { cn } from '../../utils/cn';
import { AUTH_ROLE_LABELS } from '../../types/auth';
import { portalTheme } from '../../config/portal';
import { signOut } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';

const icons = {
  home: Home,
  timeline: Activity,
  shield: Shield,
  calendar: Calendar,
  users: Users,
  building: Building2,
  flask: FlaskConical,
  pill: Pill,
  file: FileText,
  settings: Settings,
  audit: FileText,
  syringe: Syringe,
  bell: Bell,
  siren: Siren,
  help: CircleHelp,
  heart: HeartPulse,
} as const;

function Item({ item, onNavigate }: { item: AppNavItem; onNavigate?: () => void }) {
  const Icon = icons[item.icon as keyof typeof icons];
  return (
    <NavLink
      to={item.href}
      end={
        item.href === '/app/patient' ||
        item.href === '/app/doctor' ||
        item.href === '/app/hospital' ||
        item.href === '/app/laboratory' ||
        item.href === '/app/pharmacy' ||
        item.href === '/app/insurance' ||
        item.href === '/app/admin'
      }
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'workspace-link relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] transition-colors',
          isActive ? 'font-semibold' : 'font-medium text-[#bdceba]',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role, profile, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const items = role ? appNavByRole[role] : [];
  const displayName = profile?.fullName || (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Member';
  const management = new Set(['Analytics', 'Notifications', 'Staff roles', 'Hospital profile', 'Lab profile', 'Pharmacy profile', 'Insurance profile', 'System health', 'Security', 'Audit log', 'Permissions']);
  const groups = [
    { label: 'Your workspace', items: items.filter(item => !management.has(item.label)) },
    { label: 'Management', items: items.filter(item => management.has(item.label)) },
  ];

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
      onNavigate?.();
      navigate(paths.login, { replace: true });
    } catch (error) {
      push({ tone: 'error', title: 'Could not sign out', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally { setSigningOut(false); }
  };

  return (
    <div className="workspace-sidebar flex h-full flex-col bg-[#173f35] text-[#eef3e5]">
      <div className="px-6 pb-5 pt-7">
        <LandingBrand light />
        <div className="mt-7 border-b border-[#ccdfb4]/15 pb-5">
          <p className="text-[8px] font-medium uppercase tracking-[2px] text-[#a6bd98]">Connected care, made personal</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium"><span className="size-1.5 rounded-full bg-[#c7dca4]" />{role ? portalTheme[role].label : 'Your'} portal</p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-label="Workspace">
        {groups.filter(group => group.items.length > 0).map(group => <div key={group.label} className="mb-5"><p className="mb-2 px-3 text-[8px] font-semibold uppercase tracking-[1.8px] text-[#a3bb97]">{group.label}</p><div className="space-y-0.5">{group.items.map(item => <Item key={item.href} item={item} onNavigate={onNavigate} />)}</div></div>)}
        <div className="border-t border-[#ccdfb4]/15 pt-4"><p className="mb-2 px-3 text-[8px] font-semibold uppercase tracking-[1.8px] text-[#a3bb97]">Your account</p>{accountNav.map(item => <Item key={item.href} item={item} onNavigate={onNavigate} />)}<Link to={paths.home} onClick={onNavigate} className="workspace-link flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#bdceba]"><ArrowUpRight size={16} />Back to WellNest</Link></div>
      </nav>
      <div className="flex items-center gap-2.5 border-t border-[#ccdfb4]/15 bg-[#12372d] px-5 py-4">
        <Link to={paths.app.profile} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5"><Avatar name={displayName} src={profile?.avatarUrl || undefined} size="sm" /><span className="min-w-0"><span className="block truncate text-[11px] font-medium text-[#f1f4e8]">{displayName}</span><span className="mt-1 block truncate text-[9px] text-[#aabd9e]">{role ? AUTH_ROLE_LABELS[role] : 'Member'}</span></span></Link>
        <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} aria-label="Sign out" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#b9cdb0] transition hover:bg-white/10 hover:text-white disabled:opacity-50">{signingOut ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}</button>
      </div>
    </div>
  );
}
