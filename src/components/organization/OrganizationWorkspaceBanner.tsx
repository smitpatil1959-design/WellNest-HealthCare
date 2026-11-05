import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowUpRight, Building2, Check, ChevronDown, MapPin, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../providers/AuthProvider';
import { portalTheme } from '../../config/portal';
import { computeOrgCompleteness, type OrganizationProfile } from '../../types/organization';
import { cn } from '../../utils/cn';

export interface OrgNavAction { label: string; href: string; }
interface OrganizationWorkspaceBannerProps {
  org: OrganizationProfile | null | undefined;
  workspaceTitle: string;
  userRoleLabel?: string;
  memberCount?: number;
  navLinks?: OrgNavAction[];
  profileLink?: string;
  onRefresh?: () => void;
  className?: string;
}

export function OrganizationWorkspaceBanner({ org, workspaceTitle, userRoleLabel, memberCount, navLinks = [], profileLink, onRefresh, className }: OrganizationWorkspaceBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const { role } = useAuth();
  const theme = role ? portalTheme[role] : portalTheme.hospital;
  const completeness = computeOrgCompleteness(org);
  const address = [org?.address_line_1, org?.city, org?.state].filter(Boolean).join(', ');
  const detailsId = `organization-details-${role ?? 'workspace'}`;

  return (
    <header className={cn('portal-hero relative isolate overflow-hidden p-6 sm:p-8', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 size-96 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-9 -z-10 size-64 rounded-full border border-white/10" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="hero-eyebrow flex items-center gap-2 text-[9px] font-medium uppercase tracking-[1.8px]"><span className="size-1.5 rounded-full bg-[#c8dca7]" />{workspaceTitle}</span>
        {org?.status && <Badge tone={org.status === 'verified' ? 'emerald' : 'amber'} className="text-[9px]">{org.status === 'verified' ? <><ShieldCheck size={11} />Verified organization</> : org.status.replaceAll('-', ' ')}</Badge>}
      </div>
      <div className="mt-5 flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1"><h1 className="font-display tracking-tight">{org?.display_name || theme.label + ' workspace'}</h1><p className="hero-description mt-3 max-w-lg text-xs leading-7">{theme.description}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[#bfceb3]">{userRoleLabel && <span className="inline-flex items-center gap-1.5"><Building2 size={12} />{userRoleLabel}</span>}{typeof memberCount === 'number' && <span className="inline-flex items-center gap-1.5"><Users size={12} />{memberCount} active {memberCount === 1 ? 'member' : 'members'}</span>}{address && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{address}</span>}</div></div>
        <div className="hero-summary w-full shrink-0 rounded-[18px] p-5 sm:w-[240px]"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-medium">Your organization profile</span><span className="font-display text-[29px]">{completeness.percent}%</span></div><div role="progressbar" aria-label="Organization profile completeness" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dce4d2]"><div className="h-full rounded-full bg-[#738e62] transition-all" style={{width: `${completeness.percent}%`}} /></div><button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)} className="mt-3 flex min-h-7 w-full items-center justify-between text-[10px] text-[#637759]">{completeness.missing.length ? `${completeness.missing.length} details to complete` : 'Everything is up to date'}<ChevronDown size={13} className={expanded ? 'rotate-180' : ''} /></button></div>
      </div>
      {expanded && <div id={detailsId} className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 text-[11px] text-[#d9e4cc]"><p className="font-medium text-white">Organization details</p>{org?.legal_name && <p className="mt-2">{org.legal_name}</p>}{org?.registration_number && <p className="mt-2">Registration: {org.registration_number}</p>}{org?.license_number && <p className="mt-2">License: {org.license_number}</p>}{org?.email && <p className="mt-2 break-all">{org.email}</p>}{org?.phone && <p className="mt-2">{org.phone}</p>}{org?.operating_hours && <p className="mt-2">{org.operating_hours}</p>}{completeness.missing.length > 0 ? <><p className="mt-4 mb-2 text-[#b7cea2]">Still to add</p><ul className="grid gap-2 sm:grid-cols-2">{completeness.missing.map(field => <li key={field} className="flex items-center gap-2"><span className="size-1 rounded-full bg-[#cfdfba]" />{field}</li>)}</ul></> : <p className="mt-3 inline-flex items-center gap-2"><Check size={12} />Profile complete</p>}{profileLink && <NavLink to={profileLink} className="mt-4 inline-flex min-h-8 items-center gap-2 font-medium text-[#e4edcf]">Update organization profile<ArrowUpRight size={13} /></NavLink>}</div>}
      <nav aria-label="Organization portal quick links" className="mt-7 flex flex-wrap items-center gap-2 border-t border-[#c1d5a5]/20 pt-5">{navLinks.map(action => <NavLink key={action.href} to={action.href} end className={({isActive}) => cn('rounded-full border px-3.5 py-2 text-[10px] font-medium transition-colors', isActive ? 'border-transparent bg-[#d8e6bf] text-[#244c3d]' : 'border-[#c1d5a5]/25 text-[#d4e0c6] hover:bg-white/10')}>{action.label}</NavLink>)}{onRefresh && <button type="button" onClick={onRefresh} className="ml-auto flex min-h-9 items-center gap-2 px-3 text-[10px] text-[#d4e0c6]"><RefreshCw size={12} />Refresh</button>}</nav>
    </header>
  );
}
