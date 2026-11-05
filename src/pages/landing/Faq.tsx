import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { faqs } from '../../constants/content';
import { cn } from '../../utils/cn';

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Straightforward answers."
            description="If you are a CISO, a chief medical officer, or a patient who has lost a record once — start here."
          />
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {faqs.map((item, index) => {
              const isOpen = open === index;
              return (
                <div key={item.question}>
                  <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    <span className="font-semibold text-ink-900">{item.question}</span>
                    <ChevronDown className={cn('h-5 w-5 shrink-0 text-ink-400 transition duration-300', isOpen && 'rotate-180 text-brand-600')} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm leading-7 text-ink-500">{item.answer}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
