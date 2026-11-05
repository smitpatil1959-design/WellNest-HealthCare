import { ShieldCheck } from 'lucide-react';
import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { securityPillars } from '../../constants/content';
import { Reveal } from '../../components/ui/Reveal';

export function Security() {
  return (
    <Section id="security">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md">
              <img
                src="/images/illustration-security.png"
                alt="Abstract illustration of a medical shield and lock"
                className="w-full"
              />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-ink-800 shadow-md">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Designed toward HIPAA & GDPR
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Security & Governance"
              title="Trust is the core product, not an afterthought."
              description="We design as if a private hospital’s clinical counsel and a patient’s family are both reviewing the system."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {securityPillars.map((pillar) => (
                <div key={pillar.title} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h3 className="font-semibold text-ink-900 text-sm">{pillar.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{pillar.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
