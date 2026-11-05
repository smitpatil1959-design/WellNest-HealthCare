import { useMemo, useState } from 'react';
import {
  FlaskConical,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { LabTestKind, LabTestStatus } from '../../types/lab';

const kinds: { id: LabTestKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All Panels' },
  { id: 'blood', label: 'Hematology / Blood' },
  { id: 'urine', label: 'Urinalysis' },
  { id: 'pathology', label: 'Surgical Pathology' },
  { id: 'ecg', label: 'Cardiology (ECG)' },
  { id: 'xray', label: 'Radiology (X-Ray)' },
  { id: 'ct', label: 'CT Scan' },
  { id: 'mri', label: 'MRI' },
  { id: 'ultrasound', label: 'Ultrasound' },
  { id: 'custom', label: 'Specialized Panels' },
];

export default function LabTestsPage() {
  const { orders, can } = useLabPortal();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<LabTestKind | 'all'>('all');
  const [status, setStatus] = useState<LabTestStatus | 'all'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return orders
      .filter((o) => (kind === 'all' ? true : o.kind === kind))
      .filter((o) => (status === 'all' ? true : o.status === status))
      .filter((o) => `${o.test} ${o.patientName} ${o.accession} ${o.doctor}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sort === 'newest' ? b.requested.localeCompare(a.requested) : a.requested.localeCompare(b.requested)));
  }, [orders, kind, status, query, sort]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending' || o.status === 'requested').length,
      inProgress: orders.filter((o) => o.status === 'in-progress').length,
      critical: orders.filter((o) => o.priority === 'critical' || o.priority === 'stat').length,
    };
  }, [orders]);

  const getPriorityTone = (priority: string): BadgeTone => {
    switch (priority) {
      case 'critical':
        return 'rose';
      case 'stat':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'published':
        return 'emerald';
      case 'resulted':
        return 'brand';
      case 'awaiting-verify':
        return 'brand';
      case 'in-progress':
        return 'sky';
      case 'pending':
        return 'amber';
      default:
        return 'slate';
    }
  };

  if (!can('tests') && !can('all')) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="Restricted Diagnostic Workspace"
        description="Clinical receptionists and laboratory technologists hold authorization to manage the active test bench."
      />
    );
  }

  return (
    <>
      <Seo title="Laboratory Test Worklist" description="Specimen intake and diagnostic bench management." />
      
      <PatientPageHeader
        title="Laboratory Test Worklist"
        description="Monitor active specimen intake, track analyzer processing status, and review diagnostic worklists."
        action={
          <Button to={paths.app.labCompose} size="sm" leftIcon={<FlaskConical className="h-4 w-4" />}>
            Accession Specimen
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Total Worklist</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">All registered test orders</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Pending Intake</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.pending}</p>
          <p className="text-[11px] text-amber-600">Awaiting specimen collection</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Bench Processing</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.inProgress}</p>
          <p className="text-[11px] text-sky-600">Active on diagnostic instruments</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">STAT / Urgent</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{stats.critical}</p>
          <p className="text-[11px] text-rose-600">Expedited turnaround required</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search accession, patient, test, doctor..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Lifecycle Statuses' },
              { value: 'requested', label: 'Requested' },
              { value: 'pending', label: 'Pending Accession' },
              { value: 'in-progress', label: 'In Progress (Bench)' },
              { value: 'resulted', label: 'Resulted' },
              { value: 'awaiting-verify', label: 'Awaiting Verification' },
              { value: 'published', label: 'Published & Released' },
            ]}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            options={[
              { value: 'newest', label: 'Sort: Newest Requested First' },
              { value: 'oldest', label: 'Sort: Oldest Requested First' },
            ]}
          />
        </div>

        {/* Diagnostic Modality Tabs */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                setKind(k.id);
                setPage(0);
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                kind === k.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Worklist Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FlaskConical}
              title="No diagnostic orders found"
              description="No lab orders matched your search criteria or active modality filters."
            >
              {(query || kind !== 'all' || status !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setKind('all');
                    setStatus('all');
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="py-2.5 px-3">Accession #</th>
                  <th className="py-2.5 px-3">Test & Modality</th>
                  <th className="py-2.5 px-3">Patient / MRN</th>
                  <th className="py-2.5 px-3">Ordering Physician</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Requested</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {o.accession}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-sm">{o.test}</div>
                      <span className="text-[11px] text-ink-400 capitalize">{o.kind}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-ink-900 text-xs">{o.patientName}</div>
                      <span className="font-mono text-[10px] text-ink-400">MRN: {o.mrn || o.patientId.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs text-ink-800">Dr. {o.doctor}</div>
                      <span className="text-[10px] text-ink-400">{o.hospital}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getPriorityTone(o.priority)} className="uppercase text-[10px] font-semibold">
                        {o.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getStatusTone(o.status)} className="capitalize text-[10px]">
                        {o.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(o.requested)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        to={paths.app.labTest(o.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-brand-700 hover:text-brand-900 hover:bg-brand-50"
                        rightIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-ink-500">
              Showing <span className="font-semibold text-ink-800">{page * size + 1}</span> to{' '}
              <span className="font-semibold text-ink-800">{Math.min((page + 1) * size, rows.length)}</span> of{' '}
              <span className="font-semibold text-ink-800">{rows.length}</span> tests
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 text-ink-600 font-medium">
                {page + 1} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page + 1 >= pages}
                onClick={() => setPage((n) => n + 1)}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
