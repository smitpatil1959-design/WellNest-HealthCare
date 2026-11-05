import { cn } from '../../utils/cn';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance font-display text-[2rem] tracking-tight text-ink-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
