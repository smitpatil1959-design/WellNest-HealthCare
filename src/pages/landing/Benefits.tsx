import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { benefitGroups } from '../../constants/content';
import { Check } from 'lucide-react';
import { Reveal } from '../../components/ui/Reveal';

export function Benefits() {
  return (
    <Section id="benefits" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Benefits"
          title="Everyone in the room gets a calmer day."
          description="Patients stop repeating themselves. Clinicians stop reconstructing. Organizations stop faxing."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {benefitGroups.map((group) => (
            <Reveal key={group.title}>
              <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
                <h3 className="text-lg font-semibold text-ink-900">{group.title}</h3>
                <ul className="mt-6 space-y-3.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink-600">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
          <img
            src="/images/family-wellness.jpg"
            alt="Family walking together outdoors"
            className="h-72 w-full object-cover sm:h-[420px]"
          />
        </Reveal>
      </Container>
    </Section>
  );
}
