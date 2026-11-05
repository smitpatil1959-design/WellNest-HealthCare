import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../providers/AuthProvider';
import { portalTheme } from '../../config/portal';
import { HeartHandshake } from 'lucide-react';

export function PortalHeroBanner({
  roleLabel,
  title,
  description,
  actions,
  aside,
  className,
}: {
  roleLabel: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  const { role } = useAuth();
  const theme = role ? portalTheme[role] : portalTheme.patient;
  return (
    <section
      className={cn(
        'portal-hero relative isolate overflow-hidden p-6 sm:p-8',
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 size-96 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-7 -top-14 -z-10 size-72 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="hero-eyebrow inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em]">
            <span className="size-1.5 rounded-full bg-[#c5d8a5]" />
            {roleLabel}
          </span>
          <h1 className="mt-5 text-balance font-display tracking-tight">
            {title}
          </h1>
          {description ? <p className="hero-description mt-4 max-w-xl text-xs leading-7">{description}</p> : null}
          {actions ? <div className="hero-actions mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
          {aside ? <div className="mt-4">{aside}</div> : null}
        </div>
        <div className="relative hidden h-[190px] w-[205px] shrink-0 xl:block"><img src={theme.image} alt="" className="h-full w-full rounded-[70px_15px_15px_15px] object-cover" /><span className="absolute -bottom-3 -left-3 flex size-14 items-center justify-center rounded-full border-[5px] border-[#173f35] bg-[#d8e8c3] text-[#244c3d]"><HeartHandshake size={23} strokeWidth={1.4} /></span></div>
      </div>
    </section>
  );
}
