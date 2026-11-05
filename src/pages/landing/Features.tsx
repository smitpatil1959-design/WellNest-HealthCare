import { motion } from 'framer-motion';
import { Activity, KeyRound, Lock, Network, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { Container, Section } from '../../components/ui/Container';
import { featureCards } from '../../constants/content';
import { fadeUp, stagger } from '../../animations/variants';
import { cn } from '../../utils/cn';

const icons = {
  timeline: Activity,
  shield: ShieldCheck,
  key: KeyRound,
  network: Network,
  swap: ArrowLeftRight,
  lock: Lock,
} as const;

export function Features() {
  return (
    <Section id="features">
      <Container>
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Platform</p>
          <h2 className="mt-3 text-balance font-display text-[2rem] text-ink-900 sm:text-4xl">
            Built like a hospital. Feels like a consumer product.
          </h2>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-12 grid gap-4 md:grid-cols-6"
        >
          {featureCards.map((feature, index) => {
            const Icon = icons[feature.icon as keyof typeof icons];
            const wide = index === 0 || index === 3;
            return (
              <motion.article
                key={feature.id}
                variants={fadeUp}
                className={cn(
                  'group lift rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs',
                  wide ? 'md:col-span-3' : 'md:col-span-2',
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-ink-900 sm:text-lg">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500 sm:text-sm">{feature.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}
