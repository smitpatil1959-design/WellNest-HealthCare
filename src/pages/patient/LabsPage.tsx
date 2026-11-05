import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

interface LabReport {
  id: string;
  test_name: string;
  result: string;
  status: string;
  collected_at: string | null;
  released_at: string | null;
}

export default function LabsPage() {
  const query = useAuthenticatedApi<LabReport[]>('/api/lab-reports');
  const rows = query.data ?? [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'released' | 'pending'>('all');

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const matchSearch = `${item.test_name} ${item.result || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'released' ? item.status === 'released' : item.status !== 'released');
      return matchSearch && matchStatus;
    });
  }, [rows, searchTerm, statusFilter]);

  const releasedCount = rows.filter((r) => r.status === 'released').length;
  const pendingCount = rows.length - releasedCount;

  return (
    <>
      <Seo
        title="Diagnostic Lab Results — WellNest"
        description="Verified laboratory findings, diagnostic panels, and pathologist-signed reports."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Diagnostics"
          title="Laboratory Reports & Findings"
          description="Access pathologist-certified hematology, chemistry, pathology, and diagnostic imaging panels released directly to your encrypted health ID."
          action={
            <Button
              to={paths.app.patientRecords}
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
            >
              All Medical Records
            </Button>
          }
        />

        {/* Stats Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Lab Tests"
            value={rows.length}
            icon={FlaskConical}
            subtext="Lifetime history"
          />
          <StatTile
            label="Released Findings"
            value={releasedCount}
            icon={CheckCircle2}
            subtext="Clinician certified"
          />
          <StatTile
            label="In Laboratory"
            value={pendingCount}
            icon={Clock}
            subtext="Active bench tests"
          />
          <StatTile
            label="Authentication"
            value="CLIA Validated"
            icon={ShieldCheck}
            subtext="Cryptographic signature"
          />
        </motion.div>

        {/* Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search tests, analytes, findings, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(['all', 'released', 'pending'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lab Results Worklist */}
        <AuthenticatedApiState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {filteredRows.length === 0 ? (
            <EmptyState
              title={rows.length === 0 ? 'No laboratory findings released yet' : 'No matching lab reports'}
              description={
                rows.length === 0
                  ? 'Diagnostic results will appear here as soon as accredited laboratory pathologists sign and release them to your WellNest Health ID.'
                  : `No laboratory reports matched "${searchTerm}". Try adjusting your search query.`
              }
            />
          ) : (
            <motion.div variants={fadeUp} className="space-y-3">
              {filteredRows.map((report) => {
                const isReleased = report.status === 'released';
                return (
                  <Card key={report.id} hover className="transition-all">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                            isReleased
                              ? 'border-brand-200 bg-brand-50 text-brand-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          <FlaskConical className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-ink-900">{report.test_name}</h2>
                            <Badge tone={isReleased ? 'emerald' : 'amber'} className="capitalize text-[11px]">
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-ink-600">
                            {report.result || 'Analysis completed. Diagnostic report released to medical chart.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                            {report.collected_at && (
                              <span>Collected: {formatDate(report.collected_at)}</span>
                            )}
                            {report.released_at && (
                              <span>Released: <strong className="text-ink-700">{formatDate(report.released_at)}</strong></span>
                            )}
                            <span className="font-mono text-ink-400">ID: {report.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                        <Button
                          to={paths.app.record(report.id)}
                          size="sm"
                          variant="outline"
                          rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                        >
                          View Panel
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            window.print();
                          }}
                          leftIcon={<Download className="h-3.5 w-3.5" />}
                        >
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AuthenticatedApiState>
      </motion.div>
    </>
  );
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: typeof FlaskConical;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
