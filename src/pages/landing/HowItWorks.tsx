import { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { steps } from '../../constants/content';
import { cn } from '../../utils/cn';

export function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <Section id="how-it-works">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Four quiet steps. A lifetime of continuity."
          description="No new charting habit. Organizations issue what they already create. People consent to who may read it."
          align="center"
        />

        <div className="mt-14 hidden items-center gap-3 lg:flex">
          {steps.map((step, index) => (
            <div key={step.n} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all',
                  active === index ? 'bg-brand-700 text-white shadow-xs' : 'bg-slate-100 text-ink-700 hover:bg-slate-200/80',
                )}
                aria-current={active === index}
              >
                {step.n}
              </button>
              {index < steps.length - 1 ? (
                <div className="mx-3 h-px flex-1 bg-line">
                  <div
                    className="h-full bg-brand-300 transition-all duration-500"
                    style={{ width: active > index ? '100%' : '0%' }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.li
              key={step.n}
              onClick={() => setActive(index)}
              whileHover={{ y: -4 }}
              className={cn(
                'cursor-pointer rounded-2xl border bg-white p-6 shadow-xs transition-all',
                active === index ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200/80',
              )}
            >
              <span className="font-display text-3xl text-brand-200">{step.n}</span>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-500">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
