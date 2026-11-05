import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { paths } from '../../routes/paths';

export function Cta() {
  return (
    <section className="pb-24 pt-4 sm:pb-28">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-teal-800/40 bg-gradient-to-br from-[#0f4640] via-[#0d3f3a] to-[#082a26] px-8 py-14 text-white shadow-lg sm:px-14 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Start Today</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Carry the record. Let institutions issue into it.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-emerald-50/80 sm:text-base">
              A universal, source-verified health record for patients, paired with compliant, verified access workflows for care teams and organizations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={paths.register} size="lg" className="bg-emerald-500 text-ink-950 hover:bg-emerald-400 border-none">
                Create Account
              </Button>
              <Button to={paths.contact} size="lg" className="border border-white/20 bg-white/10 text-white hover:bg-white/15">
                Contact WellNest
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
