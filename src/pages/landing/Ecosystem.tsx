import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Container, Section } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { roleList } from '../../constants/roles';

const art: Record<string, string> = {
  patient: '/images/illustration-family.png',
  doctor: '/images/illustration-telemedicine.png',
  hospital: '/images/hospital-lobby.jpg',
  laboratory: '/images/laboratory.jpg',
  pharmacy: '/images/pharmacy.jpg',
  insurance: '/images/insurance.jpg',
  administrator: '/images/illustration-dashboard.png',
};

export function Ecosystem() {
  return (
    <Section id="ecosystem" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh-soft" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Medical ecosystem"
          title="Seven roles. One vocabulary of events."
          description="Patients carry the record. Organizations issue what they already create. Nobody sees everything — and that is the point."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roleList.map((role) => (
            <Link
              key={role.id}
              to={role.path}
              className="group lift overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
            >
              <div className="h-36 overflow-hidden bg-surface-soft">
                <img src={art[role.id]} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">{role.audience}</p>
                    <h3 className="mt-1 text-lg font-semibold text-ink-900">{role.label}</h3>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-ink-400 transition group-hover:text-brand-600" />
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-500">{role.headline}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
