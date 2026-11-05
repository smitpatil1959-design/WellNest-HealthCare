import { useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { formatDate } from '../../utils/format';

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const { users } = useAdminPortal();
  const user = users.find((u) => u.id === userId);
  if (!user) return <EmptyState title="Account not found" description="That operator or member is not on this tenant." />;

  return (
    <>
      <Seo title={user.name} description="Platform account — no clinical chart." />
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl text-ink-900">{user.name}</h1>
              <Badge>{user.role}</Badge>
              <Badge tone={user.status === 'active' ? 'emerald' : 'amber'}>{user.status}</Badge>
            </div>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>
      </section>
      <Card className="mt-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Organization" value={user.organization} />
          <Field label="Verified" value={user.verified ? 'Yes' : 'No'} />
          <Field label="Created" value={formatDate(user.created)} />
          <Field label="Last activity" value={formatDate(user.lastActive)} />
        </dl>
        <p className="mt-4 text-sm text-ink-400">Administrators do not open lifetime records from this screen.</p>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
