import type { ReactNode } from 'react';
import { Building2, FlaskConical, Heart, Pill, Shield, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { cn } from '../../utils/cn';
import { portalTheme } from '../../config/portal';

export function PatientPageHeader({
  eyebrow,
  title,
  description,
  action,
  badge,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  const { role } = useAuth();
  const isPatient = role === 'patient';
  const isDoctor = role === 'doctor';
  const RoleIcon = role ? { patient: Heart, doctor: Stethoscope, hospital: Building2, laboratory: FlaskConical, pharmacy: Pill, insurance: ShieldCheck, administrator: Shield }[role] : Heart;

  return (
    <div className={cn(
      'portal-page-header mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between',
      isPatient && 'patient-page-header',
      isDoctor && 'doctor-page-header',
      className,
    )}>
      <div className="min-w-0">
        {role && <span className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-medium tracking-wide"><RoleIcon size={12} />{portalTheme[role].label} portal</span>}
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-balance font-display text-3xl tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
