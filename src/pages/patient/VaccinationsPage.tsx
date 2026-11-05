import { Syringe, Calendar, Building2 } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';

interface Vaccination {
  id: string;
  vaccine_name: string;
  doses_given: number;
  administered_at: string;
  next_due_at: string | null;
  provider: string;
}

export default function VaccinationsPage() {
  const query = useAuthenticatedApi<Vaccination[]>('/api/vaccinations');
  const rows = query.data ?? [];

  return (
    <>
      <Seo title="Vaccinations" description="Immunisation history and upcoming boosters." />
      <PatientPageHeader
        eyebrow="Immunization"
        title="Vaccinations"
        description="Verified immunisation records and booster schedules recorded by licensed facilities."
      />
      <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No vaccination records"
            description="Your immunisation history will appear here once an authorized provider records it."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <Card key={row.id} hover className="transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                      <Syringe className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink-900">{row.vaccine_name}</h2>
                      <p className="flex items-center gap-1 text-xs text-ink-500 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-ink-400" />
                        {row.provider || 'Provider not recorded'}
                      </p>
                    </div>
                  </div>
                  <Badge tone="emerald">
                    {row.doses_given} {row.doses_given === 1 ? 'dose' : 'doses'}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-ink-400" />
                    Administered {new Date(row.administered_at).toLocaleDateString()}
                  </span>
                  {row.next_due_at ? (
                    <span className="font-medium text-amber-700">
                      Next due: {new Date(row.next_due_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">Schedule complete</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </AuthenticatedApiState>
    </>
  );
}
