import { Container } from '../../components/ui/Container';
import { trustedOrgs } from '../../constants/content';

export function TrustedBy() {
  return (
    <section id="trusted" className="relative py-10 sm:py-12">
      <Container>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
          Designed alongside care networks
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustedOrgs.map((org) => (
            <span key={org} className="text-sm font-semibold tracking-tight text-ink-300">
              {org}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
