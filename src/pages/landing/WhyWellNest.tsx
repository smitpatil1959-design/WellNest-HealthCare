import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { whyPoints } from '../../constants/content';
import { Reveal } from '../../components/ui/Reveal';

export function WhyWellNest() {
  return (
    <Section id="why" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Why WellNest Health"
              title="The person is the system of record."
              description="Portals multiply. Charts fragment. WellNest keeps a single, attributable history that organizations issue into and people carry forward."
            />
            <div className="mt-12 space-y-8">
              {whyPoints.map((point, index) => (
                <div key={point.title} className="flex gap-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-line">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold text-ink-900">{point.title}</h3>
                    <p className="mt-1.5 text-sm leading-7 text-ink-500">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.08} className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
              <img
                src="/images/consultation.jpg"
                alt="Physician speaking with a patient during a consult"
                className="h-[520px] w-full object-cover"
              />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/80 bg-white/95 p-4 shadow-md backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Before the consult</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-700">
                Allergies, last three diagnostic panels, active medications, and the hospital discharge summary — consented for 72 hours.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
