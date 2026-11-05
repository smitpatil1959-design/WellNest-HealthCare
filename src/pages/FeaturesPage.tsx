import { Link } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';
import { Container, Section } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { MedicalStatusBadge } from '../components/ui/MedicalStatusBadge';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { PageHero } from '../components/ui/PageHero';
import { featureCards } from '../constants/content';
import { roleList } from '../constants/roles';
import { paths } from '../routes/paths';

export default function FeaturesPage() {
  return (
    <>
      <Seo
        title="Features"
        description="Explore WellNest capabilities across patients, clinicians, hospitals, labs, pharmacies, and insurers."
      />
      <PageHero
        eyebrow="Platform capabilities"
        title="One vocabulary of events. Seven roles. A lifetime timeline."
        description="Connected health records, patient consent and shared care workflows across the WellNest portals."
      />

      <Section>
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            {featureCards.map((feature) => (
              <article key={feature.id} className="lift rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
                <Badge tone="brand" className="mb-3">Primitive</Badge>
                <h2 className="text-lg font-bold text-ink-900 sm:text-xl">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 mesh-soft" />
        <Container className="relative">
          <SectionHeading
            eyebrow="Ecosystem"
            title="Every role has a precise job."
            description="No one sees everything. That is the point."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleList.map((role) => (
              <Link
                key={role.id}
                to={role.path}
                className="lift rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">{role.audience}</p>
                <h3 className="mt-1.5 text-base font-bold text-ink-900">{role.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{role.headline}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Record primitives"
            title="What a lifetime timeline looks like."
            description="Recorded actions across participating hospital, laboratory and pharmacy accounts."
          />
          <div className="mt-10">
            <Table
              caption="Sample lifetime events"
              columns={['Event', 'Issuer', 'Status', 'Provenance']}
              rows={[
                ['Comprehensive metabolic panel', 'Harbor Laboratory', <MedicalStatusBadge key="v" status="verified" />, <VerifiedBadge key="s" label="Lab signed" />],
                ['Outpatient consult — cardiology', 'Northline Medical', <MedicalStatusBadge key="s" status="stable" />, <VerifiedBadge key="s2" label="Hospital signed" />],
                ['Lisinopril 10mg — 90 day fill', 'Aurelia Pharmacy', <MedicalStatusBadge key="p" status="pending" />, <VerifiedBadge key="s3" label="Pharmacy signed" />],
                ['Prior authorization — echo', 'Solace Health Plan', <MedicalStatusBadge key="m" status="monitoring" />, <VerifiedBadge key="s4" label="Plan signed" />],
              ]}
            />
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
            <img
              src="/images/doctor-laptop.jpg"
              alt="Physician in a telehealth consult"
              className="h-80 w-full object-cover"
            />
          </div>
          <p className="mt-8 text-center text-sm text-ink-500">
            Ready to join a design-partner cohort?{' '}
            <Link to={paths.contact} className="font-semibold text-brand-700">
              Talk to partnerships
            </Link>
            .
          </p>
        </Container>
      </Section>
    </>
  );
}
