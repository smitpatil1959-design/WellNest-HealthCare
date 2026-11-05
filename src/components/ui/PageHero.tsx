import type { ReactNode } from 'react';
import { Container } from './Container';

export function PageHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line/80">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-4 max-w-3xl text-balance font-display text-[2.6rem] leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">{description}</p>
        ) : null}
        {action ? <div className="mt-8">{action}</div> : null}
      </Container>
    </section>
  );
}
