import { useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';

export default function WorkspacePlaceholderPage() {
  const { section } = useParams();
  const { role } = useAuth();
  const title = (section ?? 'workspace').replace(/-/g, ' ');

  return (
    <>
      <Seo title={title} description={`WellNest ${title} workspace`} />
      <h1 className="font-display text-3xl capitalize text-ink-900">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-500">This surface is reserved for Phase 3 clinical workflows. Navigation and RBAC are already wired.</p>
      <Card className="mt-8" padded={false}>
        <EmptyState
          title={`The ${title} module is ready to receive data`}
          description="Issuance, consent, and review land next. Your role already has the correct permissions map."
        >
          {role ? (
            <Button to={dashboardPathFor(role)} className="mt-6">
              Back to home
            </Button>
          ) : null}
        </EmptyState>
      </Card>
    </>
  );
}
