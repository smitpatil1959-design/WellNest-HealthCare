import { useParams } from 'react-router-dom';
import { Seo } from '../components/seo/Seo';
import { Container, Section } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { roleDefinitions } from '../constants/roles';
import type { UserRole } from '../types/roles';
import { paths } from '../routes/paths';
import { NotFoundPage } from './NotFoundPage';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../providers/AuthProvider';
import { dashboardPathFor } from '../services/auth/authService';

const images: Record<UserRole, string> = {
  patient: '/images/family-wellness.jpg',
  doctor: '/images/hero-clinician.jpg',
  hospital: '/images/hospital-lobby.jpg',
  laboratory: '/images/laboratory.jpg',
  pharmacy: '/images/pharmacy.jpg',
  insurance: '/images/insurance.jpg',
  administrator: '/images/portrait-exec.jpg',
};

export default function RolePage() {
  const { user, role: accountRole } = useAuth();
  const { role: roleParam } = useParams<{ role: string }>();
  const normalized = (roleParam ?? '').replace(/s$/, '') as UserRole;
  const aliases: Record<string, UserRole> = {
    patients: 'patient',
    doctors: 'doctor',
    hospitals: 'hospital',
    laboratories: 'laboratory',
    pharmacies: 'pharmacy',
    insurance: 'insurance',
    administrators: 'administrator',
  };
  const id = aliases[roleParam ?? ''] ?? normalized;
  const def = roleDefinitions[id];

  if (!def) return <NotFoundPage />;

  return (
    <>
      <Seo title={def.label} description={def.description} />
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 mesh-soft" />
        <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge>{def.audience}</Badge>
            <h1 className="mt-5 text-balance font-display text-4xl tracking-tight text-ink-900 sm:text-5xl">{def.headline}</h1>
            <p className="mt-5 text-lg leading-8 text-ink-500">{def.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user && accountRole === def.id ? (
                <Button to={dashboardPathFor(accountRole)} size="lg">Open {def.label} workspace</Button>
              ) : user ? (
                <Button to={paths.contact} size="lg">Request {def.label} access</Button>
              ) : (
                <Button to={id === 'patient' ? paths.register : `${paths.register}?role=${encodeURIComponent(id)}`} size="lg">Get Started</Button>
              )}
              <Button to={paths.features} size="lg" variant="outline">
                All features
              </Button>
            </div>
            {user && accountRole !== def.id ? (
              <Alert tone="info" title="This account has a different verified role" className="mt-5">
                {accountRole === 'patient'
                  ? `You are signed in as a patient. A verified ${def.label.toLowerCase()} account is required to enter this workspace; this account will not be changed.`
                  : `You are signed in with the ${accountRole || 'unassigned'} role. This account will not be changed to ${def.label.toLowerCase()}.`}
              </Alert>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl shadow-md border border-slate-200/60">
            <img src={images[def.id]} alt="" className="h-80 w-full object-cover lg:h-[420px]" />
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <h2 className="font-display text-3xl text-ink-900">Capabilities for the {def.label.toLowerCase()} role</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {def.capabilities.map((cap) => (
              <article key={cap.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-200 hover:shadow-sm">
                <h3 className="font-semibold text-ink-900">{cap.title}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-500">{cap.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Record types</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {def.records.map((record) => (
                <span key={record} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-xs border border-slate-200/80">
                  {record}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </Section>

    </>
  );
}
