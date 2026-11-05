import { Container, Section } from '../../components/ui/Container';
import { Reveal } from '../../components/ui/Reveal';

export function DoctorStory() {
  return (
    <Section>
      <Container>
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700">Doctor Experience</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Context before the consult.</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Physicians do not replace their EHR. They inherit a consented timeline — labs, medications, and previous hospital summaries — so clinical encounters start with complete clarity.
              </p>
            </div>
            <img src="/images/portrait-dr-chen.jpg" alt="Dr. Maya Chen" className="mt-6 h-48 w-full rounded-xl object-cover object-top" />
          </Reveal>
          <Reveal>
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
              <img src="/images/consultation.jpg" alt="Physician with a patient" className="h-full min-h-[360px] w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
