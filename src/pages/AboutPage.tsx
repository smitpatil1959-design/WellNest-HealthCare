import { Seo } from '../components/seo/Seo';
import { Container, Section } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { Timeline } from '../components/ui/Timeline';
import { PageHero } from '../components/ui/PageHero';
import { paths } from '../routes/paths';
import { appConfig } from '../config/app';

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="WellNest is building a secure digital health ecosystem for lifetime, source-verified medical records."
      />
      <PageHero
        eyebrow="About WellNest"
        title="A calmer infrastructure for the most important records a person will ever have."
        description="We started WellNest because healthcare still treats the institution as the system of record. People move. Systems do not. Charts get left behind."
      />

      <Section>
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
            <img
              src="/images/hospital-lobby.jpg"
              alt="Bright modern hospital interior"
              className="h-[440px] w-full object-cover"
            />
          </div>
          <div>
            <SectionHeading
              title="We are not another EHR."
              description={`${appConfig.name} sits above the systems clinicians already use. Hospitals, labs, and pharmacies issue signed events. Patients carry the history. Insurers review what was actually attested.`}
            />
            <p className="mt-6 text-sm leading-7 text-ink-500">
              The product language is deliberately quiet — Apple Health restraint, private-hospital gravitas. We believe trust is a visual property as much as a cryptographic one.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 mesh-soft" />
        <Container className="relative grid gap-14 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Principles"
            title="How we decide."
            description="Every roadmap item is measured against these four commitments."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['People first', 'The lifetime record belongs to the person. Organizations author; they do not own the whole story.'],
              ['Provenance always', 'If it cannot be signed by a credentialed issuer, it does not become a clinical fact.'],
              ['Consent you can read', 'No blanket portals. Windows, purposes, and an access log the patient can actually follow.'],
              ['Quiet software', 'Serious medicine deserves calm interfaces. No gamification. No noisy gradients.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <h3 className="font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid items-start gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Roadmap" title="Where we are." />
            <div className="mt-10">
              <Timeline
                items={[
                  {
                    title: 'Phase 1 — Foundation',
                    meta: 'Now',
                    body: 'Design system, public site, role architecture. Universal health identity and verified tokens.',
                    tone: 'emerald',
                  },
                  {
                    title: 'Phase 2 — Identity & records',
                    meta: 'Next',
                    body: 'Accounts, organizational credentials, lifetime timeline, consent grants.',
                    tone: 'brand',
                  },
                  {
                    title: 'Phase 3 — Clinical issuance',
                    meta: 'Later',
                    body: 'Hospital encounters, lab panels, pharmacy fills, insurer review workspaces.',
                    tone: 'sky',
                  },
                ]}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
            <img
              src="/images/medical-team.jpg"
              alt="Clinical team walking a hospital corridor"
              className="h-full max-h-[480px] w-full object-cover"
            />
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="rounded-2xl border border-slate-200/80 bg-white px-8 py-12 text-center shadow-xs sm:px-12">
          <img src="/images/illustration-invite.png" alt="" className="mx-auto mb-5 h-24 w-24 object-contain" />
          <h2 className="font-display text-3xl font-bold text-ink-900">Meet the team building this.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
            Partnerships, institutional security audits, and clinical pilot conversations are open.
          </p>
          <div className="mt-6 flex justify-center">
            <Button to={paths.contact} size="lg">
              Contact WellNest
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
