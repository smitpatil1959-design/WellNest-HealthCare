import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  FileText,
  Search,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { grantAllowsConsentCategory } from '../../../shared/consent-categories.js';
import { formatDate } from '../../utils/format';

interface GrantRow {
  id: string;
  patient_name: string;
  categories: string;
  status: string;
  expires_at: string | null;
}

interface RecordRow {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  date: string | null;
  doctor: string | null;
  hospital: string | null;
  laboratory: string | null;
  created_at: string;
}

interface LabReportRow {
  id: string;
  test_name: string;
  result: string | null;
  status: string;
  collected_at: string | null;
  released_at: string | null;
  created_at: string;
}

interface ReportViewRow {
  id: string;
  rowKey: string;
  title: string;
  category: string;
  summary: string | null;
  date: string | null;
  source: string | null;
  created_at: string;
  patientLabel: string;
  grantId?: string;
}

export default function DoctorReportsPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const { session } = useAuth();
  const activeGrants = (grantsQuery.data ?? []).filter((grant) => grant.status === 'active');
  const labGrants = activeGrants.filter((grant) => grantAllowsConsentCategory(grant, 'lab_report'));

  const reportQueries = useQueries({
    queries: activeGrants.map((grant) => ({
      queryKey: ['authorized-patient-records', grant.id],
      enabled: Boolean(session?.access_token),
      queryFn: async () => {
        const endpoint = `/api/records?grantId=${encodeURIComponent(grant.id)}`;
        const result = await safeApiFetch<RecordRow[]>(endpoint, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        if (!result.ok) throw new Error(result.error);
        return result.data;
      },
    })),
  });

  const labReportQueries = useQueries({
    queries: labGrants.map((grant) => ({
      queryKey: ['authorized-patient-lab-reports', grant.id],
      enabled: Boolean(session?.access_token),
      queryFn: async () => {
        const endpoint = `/api/lab-reports?grantId=${encodeURIComponent(grant.id)}`;
        const result = await safeApiFetch<LabReportRow[]>(endpoint, { headers: { Authorization: `Bearer ${session?.access_token}` } });
        if (!result.ok) throw new Error(result.error);
        return result.data;
      },
    })),
  });

  const loading =
    grantsQuery.isLoading ||
    reportQueries.some((q) => q.isLoading) ||
    labReportQueries.some((q) => q.isLoading);
  const error =
    grantsQuery.isError ||
    reportQueries.some((q) => q.isError) ||
    labReportQueries.some((q) => q.isError);

  const recordRows: ReportViewRow[] = reportQueries.flatMap((q, index) =>
    (q.data ?? []).map((record) => ({
      ...record,
      rowKey: `record-${activeGrants[index]?.id}-${record.id}`,
      source: record.doctor || record.laboratory || record.hospital,
      patientLabel: activeGrants[index]?.patient_name || 'Authorized patient',
      grantId: activeGrants[index]?.id,
    }))
  );

  const labRows: ReportViewRow[] = labReportQueries.flatMap((q, index) =>
    (q.data ?? []).map((report) => ({
      id: report.id,
      rowKey: `lab-${labGrants[index]?.id}-${report.id}`,
      title: report.test_name,
      category: 'Lab report',
      summary: report.result,
      date: report.collected_at || report.released_at,
      source: null,
      created_at: report.created_at,
      patientLabel: labGrants[index]?.patient_name || 'Authorized patient',
      grantId: labGrants[index]?.id,
    }))
  );

  const allReports = [...recordRows, ...labRows];

  const search = query.trim().toLowerCase();
  const filteredReports = allReports.filter((report) => {
    const matchesQuery =
      !search ||
      report.title.toLowerCase().includes(search) ||
      report.patientLabel.toLowerCase().includes(search) ||
      Boolean(report.source?.toLowerCase().includes(search));
    const matchesCategory =
      selectedCategory === 'all' ||
      report.category.toLowerCase().includes(selectedCategory);
    return matchesQuery && matchesCategory;
  });

  return (
    <>
      <Seo title="Consented Reports" description="Review records shared with your verified account." />
      <PatientPageHeader
        eyebrow="Clinical Diagnostics"
        title="Consented reports"
        description="Records and diagnostic laboratory findings appear here only while a patient has an active, valid access grant for your verified medical account."
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Consented Reports</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{allReports.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Lab Reports</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{labRows.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Clinical Documents</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{recordRows.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Consented Patients</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{activeGrants.length}</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient, test name, facility..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'lab', 'visit'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Types' : cat === 'lab' ? 'Lab Results' : 'Clinical Visits'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {error ? (
        <Alert tone="error" title="Reports could not be loaded">
          Check your connection and access grant, then reload this page.
        </Alert>
      ) : null}

      {!loading && !error && filteredReports.length === 0 ? (
        <EmptyState
          title="No consented reports found"
          description="When a patient approves access for your account, their permitted diagnostic records will appear here."
          icon={FileText}
        />
      ) : null}

      {!loading && !error && filteredReports.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Report Title & Type</th>
                  <th className="px-4 py-3">Clinical Source</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Findings / Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-ink-800">
                {filteredReports.map((record) => (
                  <tr key={record.rowKey} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-ink-700">
                          {record.patientLabel.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink-900 text-xs">{record.patientLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="font-semibold text-ink-900 text-xs">{record.title}</p>
                      <Badge tone="slate" className="mt-1 text-[10px] uppercase tracking-wider">
                        {record.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-600">
                      {record.source || 'Source not listed'}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(record.date || record.created_at)}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-sm">
                      {record.summary ? (
                        <p className="line-clamp-2 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                          {record.summary}
                        </p>
                      ) : (
                        <span className="text-ink-400 italic">No notes</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
