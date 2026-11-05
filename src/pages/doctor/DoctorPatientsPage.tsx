import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  ShieldCheck,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';

interface GrantRow {
  id: string | number;
  patient_name: string;
  categories: string;
  status: string;
  expires_at: string | null;
}

export default function DoctorPatientsPage() {
  const [query, setQuery] = useState('');
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const activeGrants = useMemo(
    () => (grantsQuery.data ?? []).filter((grant) => grant.status === 'active'),
    [grantsQuery.data],
  );
  const scheduledExpirations = activeGrants.filter((grant) => Boolean(grant.expires_at)).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeGrants.filter((grant) =>
      `${grant.patient_name} ${grant.categories}`.toLowerCase().includes(q),
    );
  }, [activeGrants, query]);

  return (
    <>
      <Seo title="Consented Patient Panel" description="Patients who have consented to this clinician." />
      <PatientPageHeader
        eyebrow="Consented Panel"
        title="Consented patient panel"
        description="Review patient-approved access grants and their permitted record categories. Search the patient names and consent scopes available to your account."
        action={
          <Button to={paths.app.lookup} size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
            Request Patient Consent
          </Button>
        }
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Active consent grants</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{activeGrants.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" /> Scheduled expirations</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{scheduledExpirations}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Matching patients</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{rows.length}</p>
        </div>
      </div>

      <div className="mb-5 max-w-md">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient name or consent scope..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {grantsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : null}

      {grantsQuery.isError ? (
        <Alert tone="error" title="Consented patient list unavailable">
          {grantsQuery.error?.message || 'Check your connection and retry.'}
        </Alert>
      ) : null}

      {!grantsQuery.isLoading && !grantsQuery.isError && rows.length === 0 ? (
        <EmptyState
          title="No active patient grants found"
          description="Patients appear here after they approve an access request for your verified account."
          icon={Users}
          actionLabel="Lookup Patient Health ID"
          onAction={() => window.location.assign(paths.app.lookup)}
        />
      ) : null}

      {!grantsQuery.isError && rows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Consent scope</th>
                  <th className="px-4 py-3">Consent Status</th>
                  <th className="px-4 py-3">Access Expiration</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-ink-800">
                {rows.map((grant) => {
                  const initials = grant.patient_name
                    ? grant.patient_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'PT';

                  return (
                    <tr key={grant.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-xs text-brand-800">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{grant.patient_name || 'Patient'}</p>
                            <p className="text-[11px] text-ink-400">Grant #{grant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-medium text-ink-700">
                          {grant.categories || 'All Medical Records'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <Badge tone="emerald" className="gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Consented
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-ink-500 whitespace-nowrap">
                        {grant.expires_at ? formatDate(grant.expires_at) : 'No scheduled expiry'}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button to={paths.app.doctorPatient(String(grant.id))} size="sm" variant="primary">
                            Open Chart
                          </Button>
                          <Button to={paths.app.doctorConsult(String(grant.id))} size="sm" variant="outline">
                            Visit Note
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-ink-400">
        Need to access an unconsented patient's history?{' '}
        <Link to={paths.app.lookup} className="font-semibold text-brand-700 hover:text-brand-800">
          Search Health ID & request access grant
        </Link>
      </p>
    </>
  );
}
