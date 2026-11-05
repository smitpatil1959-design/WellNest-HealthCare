import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white shadow-xs hover:bg-brand-800 border border-brand-800/30 active:scale-[0.99]',
  secondary:
    'bg-ink-900 text-white hover:bg-ink-950 shadow-xs border border-ink-950/20 active:scale-[0.99]',
  outline:
    'border border-line bg-white text-ink-800 hover:bg-slate-50 hover:text-ink-950 hover:border-slate-300 shadow-xs active:scale-[0.99]',
  ghost:
    'text-ink-700 hover:bg-slate-100/70 hover:text-ink-950 active:scale-[0.99]',
  soft:
    'bg-brand-50 text-brand-800 hover:bg-brand-100/80 border border-brand-100/80 active:scale-[0.99]',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-rose-700/20 active:scale-[0.99]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-9 px-3 text-xs font-semibold rounded-lg',
  md: 'h-10 min-h-10 px-4 text-sm font-semibold rounded-xl',
  lg: 'h-11 min-h-11 px-5 text-[15px] font-semibold rounded-xl',
  xl: 'h-12 min-h-12 px-6 text-base font-semibold rounded-xl',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    'relative inline-flex items-center justify-center gap-2 overflow-hidden font-semibold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );
}
