import { Container, Section } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Reveal';

export function DashboardPreview() {
  return (
    <Section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Patient workspace overview</p>
          <h2 className="mt-3 font-display text-3xl text-ink-900 sm:text-5xl">A clearer view of your health journey.</h2>
          <p className="mt-4 text-ink-500">This illustration shows how records, appointments, and care information can be organized in one workspace. Sign in to view information connected to your account.</p>
          <Button to="/login" className="mt-6">
            Sign in to your account
          </Button>
        </Reveal>
        <Reveal className="mt-12 overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
          <img src="/images/illustration-dashboard.png" alt="Patient dashboard illustration" className="hidden w-full bg-white object-cover sm:block sm:h-[380px]" />
          <img src="/images/phone-mockup.png" alt="" className="mx-auto h-[420px] object-contain sm:hidden" />
        </Reveal>
      </Container>
    </Section>
  );
}
