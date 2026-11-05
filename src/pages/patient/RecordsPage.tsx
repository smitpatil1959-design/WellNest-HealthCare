import { useMemo, useState } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  FileText,
  FlaskConical,
  Eye,
  Calendar,
  Building2,
  Stethoscope,
  Scissors,
  Syringe,
  UploadCloud,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { RecordCard } from '../../components/patient/RecordCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import type { RecordCategory } from '../../types/patient';
import { formatDate } from '../../utils/format';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';

interface DbRecord {
  id: string;
  title: string;
  category: string;
  source: string;
  status: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  laboratory: string | null;
  summary: string | null;
}

const recordCategories: { id: RecordCategory | 'all'; label: string; icon: typeof FileText }[] = [
  { id: 'all', label: 'All Records', icon: FileText },
  { id: 'lab', label: 'Labs', icon: FlaskConical },
  { id: 'imaging', label: 'Imaging', icon: Eye },
  { id: 'visit', label: 'Clinical Visits', icon: Stethoscope },
  { id: 'discharge', label: 'Discharges', icon: Building2 },
  { id: 'prescription', label: 'Prescriptions', icon: FileText },
  { id: 'vaccination', label: 'Vaccines', icon: Syringe },
  { id: 'surgery', label: 'Surgeries', icon: Scissors },
  { id: 'upload', label: 'Uploaded', icon: UploadCloud },
];

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'lab':
      return FlaskConical;
    case 'imaging':
      return Eye;
    case 'visit':
      return Stethoscope;
    case 'discharge':
      return Building2;
    case 'vaccination':
      return Syringe;
    case 'surgery':
      return Scissors;
    case 'upload':
      return UploadCloud;
    default:
      return FileText;
  }
}

export default function RecordsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RecordCategory | 'all'>('all');
  const [source, setSource] = useState<'all' | 'verified' | 'uploaded' | 'unknown'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [view, setView] = useState<'table' | 'grid' | 'timeline'>('table');

  const queryState = useAuthenticatedApi<DbRecord[]>('/api/records');
  const medicalRecords = (queryState.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category as RecordCategory,
    source: item.source === 'upload' || item.source === 'uploaded' ? ('uploaded' as const) : item.source === 'verified' ? ('verified' as const) : ('unknown' as const),
    status: item.status === 'pending' ? ('pending' as const) : item.status === 'released' ? ('released' as const) : ('verified' as const),
    date: item.date,
    hospital: item.hospital ?? '',
    doctor: item.doctor ?? '',
    laboratory: item.laboratory ?? undefined,
    summary: item.summary ?? '',
    tags: [],
  }));

  const verifiedCount = medicalRecords.filter((r) => r.source === 'verified').length;
  const uploadedCount = medicalRecords.filter((r) => r.source === 'uploaded').length;

  const rows = useMemo(() => {
    return medicalRecords
      .filter((item) => (category === 'all' ? true : item.category === category))
      .filter((item) => (source === 'all' ? true : item.source === source))
      .filter((item) => {
        const hay = `${item.title} ${item.hospital} ${item.doctor}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => (sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  }, [category, source, query, sort, medicalRecords]);

  return (
    <>
      <Seo title="Medical Records" description="Verified and uploaded reports in your lifetime record." />
      <PatientPageHeader
        eyebrow="Clinical Repository"
        title="Medical records"
        description="Review saved clinical records and patient uploads. Source labels reflect recorded attribution; older entries may be unclassified."
      />

      {/* Metric Cards Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Records</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{medicalRecords.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Provider-issued</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Patient Uploads</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{uploadedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Active Filter Results</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{rows.length}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-[280px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records by title, doctor, facility..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            options={[
              { value: 'all', label: 'All Sources' },
              { value: 'verified', label: 'Provider-issued' },
              { value: 'uploaded', label: 'Self Uploaded' },
              { value: 'unknown', label: 'Source not recorded' },
            ]}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
            ]}
          />
          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-50/80 p-1">
            {(['table', 'grid', 'timeline'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all flex items-center gap-1.5',
                  view === mode ? 'bg-white text-ink-900 shadow-2xs font-bold' : 'text-ink-500 hover:text-ink-800'
                )}
              >
                {mode === 'table' ? <List className="h-3.5 w-3.5" /> : mode === 'grid' ? <LayoutGrid className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proper Pill Category Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {recordCategories.map((item) => {
          const Icon = item.icon;
          const isSelected = category === item.id;
          const count = item.id === 'all' ? medicalRecords.length : medicalRecords.filter((r) => r.category === item.id).length;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                isSelected
                  ? 'bg-brand-600 text-white shadow-xs font-semibold'
                  : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-white' : 'text-ink-400')} />
              <span>{item.label}</span>
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isSelected ? 'bg-brand-700 text-teal-100' : 'bg-slate-100 text-ink-500'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <AuthenticatedApiState loading={queryState.isLoading} error={queryState.error} retry={() => { void queryState.refetch(); }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No medical records found"
            description="No documents match your query. Clear filters or check back after your provider releases reports."
            icon={FileText}
          />
        ) : view === 'table' ? (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Report Details</th>
                    <th className="px-4 py-3">Source & Facility</th>
                    <th className="px-4 py-3">Attending</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-ink-800">
                  {rows.map((record) => {
                    const CatIcon = getCategoryIcon(record.category);
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-slate-50/80 group">
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-brand-700">
                              <CatIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <Link
                                to={paths.app.record(record.id)}
                                className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors"
                              >
                                {record.title}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-400">
                                  {record.category}
                                </span>
                                {record.source === 'verified' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    <ShieldCheck className="h-2.5 w-2.5" /> Provider-issued
                                  </span>
                                ) : (
                                  <span className="inline-flex text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {record.source === 'uploaded' ? 'Patient-uploaded' : 'Source not recorded'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-xs text-ink-600">
                          {record.hospital || record.laboratory || 'Not specified'}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-xs text-ink-600">
                          {record.doctor || '—'}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-xs font-medium text-ink-500 whitespace-nowrap">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <Badge tone={record.status === 'released' || record.status === 'verified' ? 'emerald' : 'amber'}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <Button size="sm" variant="outline" to={paths.app.record(record.id)}>
                            View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-slate-200 pl-6 my-2">
            {rows.map((record) => {
              const CatIcon = getCategoryIcon(record.category);
              return (
                <li key={record.id} className="relative">
                  <span className="absolute -left-[31px] mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 border-2 border-brand-600 text-brand-700">
                    <CatIcon className="h-3 w-3" />
                  </span>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{formatDate(record.date)}</p>
                        <Link to={paths.app.record(record.id)} className="mt-1 block font-semibold text-ink-900 hover:text-brand-700 transition-colors">
                          {record.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {record.hospital}{record.doctor ? ` · Attending: ${record.doctor}` : ''}
                        </p>
                      </div>
                      <Badge tone={record.status === 'released' || record.status === 'verified' ? 'emerald' : 'amber'}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </AuthenticatedApiState>
    </>
  );
}
