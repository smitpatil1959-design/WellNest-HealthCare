import { useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { useToast } from '../../providers/ToastProvider';

export default function AdminOrganizationDetailPage() {
  const { orgId } = useParams();
  const { orgs, setOrgStatus } = useAdminPortal();
  const { push } = useToast();
  const org = orgs.find((o) => o.id === orgId);
  if (!org) return <EmptyState title="Organization not found" description="That issuer is not on this network." />;

  return (
    <>
      <Seo title={org.name} description="Issuer profile." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl text-ink-900">{org.name}</h1>
        <Badge>{org.status.replace('-', ' ')}</Badge>
      </div>
      <Card>
        <p className="text-sm text-ink-600">
          {org.kind} · {org.registration} · {org.users} authorized users
        </p>
        <p className="mt-2 text-sm text-ink-500">Documents: {org.documents.join(', ')}</p>
        <p className="mt-1 text-xs text-ink-400">Reviewer: {org.reviewer ?? 'Unassigned'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {org.status !== 'verified' ? (
            <Button
              size="sm"
              onClick={() => {
                if (window.confirm(`Verify ${org.name}? This is an authorized issuer action.`)) {
                  setOrgStatus(org.id, 'verified');
                  push({ tone: 'success', title: 'Organization verified' });
                }
              }}
            >
              Verify
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setOrgStatus(org.id, 'under-review')}>
            Mark under review
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (window.confirm(`Suspend ${org.name}?`)) setOrgStatus(org.id, 'suspended');
            }}
          >
            Suspend
          </Button>
        </div>
      </Card>
    </>
  );
}
