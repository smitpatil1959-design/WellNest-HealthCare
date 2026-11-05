import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FlaskConical,
  ShieldCheck,
  Eye,
  Filter,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

export default function LabReportsPage() {
  const { reports } = useLabPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'awaiting-verify' | 'critical'>('all');

  const publishedCount = reports.filter((r) => r.status === 'published').length;
  const awaitingCount = reports.filter((r) => r.status === 'awaiting-verify').length;
  const criticalCount = reports.filter((r) => r.critical).length;

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchSearch = `${rep.title} ${rep.reportId} ${rep.patientName} ${rep.doctor || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'critical' ? rep.critical : rep.status === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  return (
    <>
      <Seo
        title="Diagnostic Report Archive — Laboratory Command"
        description="Versioned laboratory findings, verified molecular panels, and pathologist certifications."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Diagnostic Archive"
          title="Laboratory Reports & Findings Archive"
          description="Browse immutable, version-controlled diagnostic documents signed by credentialed clinical pathologists. Every release updates the patient lifetime timeline."
          action={
            <Button
              to={paths.app.labCompose}
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Compose Diagnostic Report
            </Button>
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Reports"
            value={reports.length}
            icon={FileText}
            subtext="Archived panels"
          />
          <StatTile
            label="Certified Published"
            value={publishedCount}
            icon={CheckCircle2}
            subtext="Released to patients"
          />
          <StatTile
            label="Awaiting Sign-Off"
            value={awaitingCount}
            icon={Clock}
            subtext="Pathologist desk"
          />
          <StatTile
            label="Critical Findings"
            value={criticalCount}
            icon={AlertTriangle}
            subtext="Immediate readback"
          />
        </motion.div>

        {/* Search & Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search reports by accession, test title, patient MRN, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'published', 'awaiting-verify', 'critical'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                {s === 'awaiting-verify' ? 'Awaiting Sign-off' : s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reports Worklist */}
        <motion.div variants={fadeUp} className="space-y-3">
          {filteredReports.map((r) => {
            const isPublished = r.status === 'published';
            return (
              <Card key={r.id} hover className="transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        r.critical
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : isPublished
                          ? 'border-brand-200 bg-brand-50 text-brand-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink-900">{r.title}</h3>
                        <span className="font-mono text-xs rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-ink-700">
                          {r.reportId}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          v{r.version}
                        </span>
                        {r.critical && <Badge tone="rose">Critical Value</Badge>}
                        <Badge
                          tone={
                            isPublished
                              ? 'emerald'
                              : r.status === 'superseded'
                              ? 'slate'
                              : 'amber'
                          }
                          className="capitalize text-[10px]"
                        >
                          {r.status.replace('-', ' ')}
                        </Badge>
                      </div>

                      <p className="text-xs text-ink-600">
                        Patient: <strong className="text-ink-900">{r.patientName}</strong> · Ordering Attending: {r.doctor || 'Physician'} · {r.hospital || 'Hospital Campus'}
                      </p>

                      {r.impression && (
                        <p className="text-xs text-ink-500 line-clamp-1 italic">
                          Impression: "{r.impression}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <Button
                      to={paths.app.labReport(r.id)}
                      size="sm"
                      variant="outline"
                      rightIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Inspect Report
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>
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
  icon: typeof FileText;
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
