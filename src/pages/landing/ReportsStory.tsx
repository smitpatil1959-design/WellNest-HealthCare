import { Container, Section } from '../../components/ui/Container';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { Reveal } from '../../components/ui/Reveal';

export function ReportsStory() {
  return (
    <Section className="relative overflow-hidden bg-[#0d3b36] text-white">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Diagnostic Reports</p>
            <h2 className="mt-3 font-display text-[2.1rem] leading-[1.12] sm:text-5xl">Results that cannot be forged or lost.</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-50/80">
              A participating laboratory verifies and releases the panel to the patient's account, with structured clinical values alongside any cleared attachment.
            </p>
          </Reveal>
          <Reveal>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Comprehensive Metabolic Panel</p>
                <VerifiedBadge label="Lab Signed" />
              </div>
              <p className="mt-1 text-xs text-white/60">Harbor Diagnostic Laboratory · Released</p>
              <div className="mt-5 space-y-2.5">
                {[
                  ['Glucose', '92 mg/dL'],
                  ['Creatinine', '0.8 mg/dL'],
                  ['ALT', '41 U/L'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-xs">
                    <span className="text-white/70">{k}</span>
                    <span className="font-semibold text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
