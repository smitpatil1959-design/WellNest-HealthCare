import { Container, Section } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { paths } from '../../routes/paths';
import { Reveal } from '../../components/ui/Reveal';

export function PatientStory() {
  return (
    <Section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Patient experience</p>
            <h2 className="mt-4 max-w-xl text-balance font-display text-[2.1rem] leading-[1.1] text-ink-900 sm:text-5xl">
              Walk into a new city. Keep the same chart.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-ink-500">
              Elena granted Dr. Chen seventy-two hours. Allergies, last CBC, and the Harbor discharge note arrived before the consult — because she consented, not because someone faxed a folder.
            </p>
            <Button to={paths.roles.patient} className="mt-8" variant="outline">
              See the patient story
            </Button>
          </Reveal>
          <Reveal className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
              <img src="/images/family-wellness.jpg" alt="Family walking together" className="h-[400px] w-full object-cover sm:h-[480px]" />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-xl border border-white/80 bg-white/95 p-4 shadow-md backdrop-blur-xl sm:left-auto sm:right-6 sm:w-64">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Lifetime Health Index</p>
              <p className="mt-1 font-display text-3xl font-bold text-ink-900">86</p>
              <p className="text-xs text-emerald-700 font-medium">Stable · Care history verified</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
