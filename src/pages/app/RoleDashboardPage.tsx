import { useAuth } from '../../providers/AuthProvider';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Sparkline } from '../../components/ui/Sparkline';
import { Timeline } from '../../components/ui/Timeline';
import { MedicalStatusBadge } from '../../components/ui/MedicalStatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { roleDefinitions } from '../../constants/roles';
import { AUTH_ROLE_LABELS } from '../../types/auth';
import { paths } from '../../routes/paths';
import { hasPermission } from '../../config/permissions';

const art: Record<string, string> = {
  doctor: '/images/hero-clinician.jpg',
  hospital: '/images/hospital-lobby.jpg',
  laboratory: '/images/laboratory.jpg',
  pharmacy: '/images/pharmacy.jpg',
  insurance: '/images/insurance.jpg',
  administrator: '/images/portrait-exec.jpg',
};

export default function RoleDashboardPage() {
  const { profile, role } = useAuth();
  if (!profile || !role) return null;
  const def = roleDefinitions[role];

  return (
    <>
      <Seo title={`${AUTH_ROLE_LABELS[role]} workspace`} description={`Secure ${AUTH_ROLE_LABELS[role]} dashboard for WellNest.`} />
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="pointer-events-none absolute inset-0 aurora opacity-70" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>{AUTH_ROLE_LABELS[role]}</Badge>
            <h1 className="mt-3 font-display text-3xl tracking-tight text-ink-900 sm:text-4xl">
              Good to see you, {profile.fullName.split(' ')[0]}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-500">{def.headline}</p>
          </div>
          <Button to={paths.app.profile} variant="outline">
            Account
          </Button>
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">In view</p>
          <p className="mt-3 font-display text-4xl text-ink-900">12</p>
          <p className="mt-1 text-sm text-ink-500">Consented events</p>
          <Sparkline className="mt-4 w-full" points={[6, 9, 8, 12, 11, 14, 13, 16]} />
        </Card>
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Status</p>
          <div className="mt-4">
            <MedicalStatusBadge status="verified" />
          </div>
          <p className="mt-3 text-sm text-ink-500">Issuer credentials current</p>
        </Card>
        <Card hover>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Permissions</p>
          <p className="mt-3 font-display text-4xl text-ink-900">{hasPermission(role, 'workspace:access') ? 'Ready' : '—'}</p>
          <p className="mt-1 text-sm text-ink-500">RBAC scoped to this role</p>
        </Card>
        <Card hover className="overflow-hidden p-0">
          <img src={art[role] ?? '/images/clinic-interior.jpg'} alt="" className="h-28 w-full object-cover" />
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Organization</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{profile.organization || 'Independent'}</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="mb-5 text-sm font-semibold text-ink-900">Workspace timeline</p>
          <Timeline
            items={def.records.slice(0, 4).map((record, index) => ({
              title: record,
              meta: index === 0 ? 'Today' : `${index + 1}d`,
              body: `Reserved for ${def.label.toLowerCase()} issuance.`,
              tone: index === 0 ? 'emerald' : 'brand',
            }))}
          />
        </Card>
        <Card className="lg:col-span-2" padded={false}>
          <EmptyState
            title="Issuance arrives next"
            description="This console is ready for signed events. Phase 3 clinical write paths land after the patient portal."
          />
        </Card>
      </div>
    </>
  );
}
