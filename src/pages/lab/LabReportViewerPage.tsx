import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  History,
  ChevronLeft,
  Printer,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { labOrg } from '../../constants/labData';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { useToast } from '../../providers/ToastProvider';
import {LabFilePanel} from '../../components/organization/LabFilePanel';

export default function LabReportViewerPage() {
  const { reportId } = useParams();
  const { reports, reviseReport } = useLabPortal();
  const { push } = useToast();
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <EmptyState
        icon={FileText}
        title="Diagnostic Report Not Found"
        description="The requested diagnostic report version does not exist in this laboratory bench."
      >
        <Button to={paths.app.labReports} size="sm" variant="outline" className="mt-4" leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Back to Reports List
        </Button>
      </EmptyState>
    );
  }

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'published':
        return 'emerald';
      case 'verified':
        return 'brand';
      case 'awaiting-verify':
        return 'brand';
      case 'draft':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getFlagBadge = (flag?: 'H' | 'L' | 'C') => {
    switch (flag) {
      case 'C':
        return <Badge tone="rose" className="font-bold text-[10px]">CRITICAL</Badge>;
      case 'H':
        return <Badge tone="amber" className="font-semibold text-[10px]">HIGH</Badge>;
      case 'L':
        return <Badge tone="sky" className="font-semibold text-[10px]">LOW</Badge>;
      default:
        return <Badge tone="emerald" className="text-[10px]">NORMAL</Badge>;
    }
  };

  return (
    <>
      <Seo title={`${report.reportId} - ${report.title}`} description={report.title} />
      <LabFilePanel versionId={report.id} status={report.status} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Link to={paths.app.labReports} className="hover:text-brand-700 transition flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> All Reports
            </Link>
            <span>/</span>
            <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{report.reportId}</span>
            <span className="text-ink-400">v{report.version}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{report.title}</h1>
          <p className="text-xs text-ink-500">
            Patient: <span className="font-medium text-ink-800">{report.patientName}</span> · Ordering Physician: Dr. {report.doctor}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getStatusTone(report.status)} className="capitalize text-xs font-semibold">
            {report.status.replace('-', ' ')}
          </Badge>
          {report.critical && (
            <Badge tone="rose" className="text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Critical Values
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!(await reviseReport(report.id))) return;
              push({ tone: 'info', title: 'Revision Created', description: `Draft v${report.version + 1} initialized.` });
            }}
          >
            Create Revision
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-3.5 w-3.5" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Patient & Facility Context Banner */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:grid-cols-4 text-xs">
        <div>
          <span className="text-ink-400">Patient Full Name</span>
          <p className="font-bold text-ink-900 text-sm mt-0.5">{report.patientName}</p>
          <span className="font-mono text-[10px] text-ink-400">ID: {report.patientId}</span>
        </div>
        <div>
          <span className="text-ink-400">Ordering Physician</span>
          <p className="font-medium text-ink-900 text-sm mt-0.5">Dr. {report.doctor}</p>
          <span className="text-[11px] text-ink-500">{report.hospital}</span>
        </div>
        <div>
          <span className="text-ink-400">Performing Laboratory</span>
          <p className="font-medium text-ink-900 text-sm mt-0.5">{labOrg.name}</p>
          <span className="text-[11px] text-ink-500">CLIA: {labOrg.clia}</span>
        </div>
        <div>
          <span className="text-ink-400">Release Status</span>
          <p className="font-semibold text-emerald-700 text-sm mt-0.5 capitalize">{report.status}</p>
          <span className="text-[11px] text-ink-500">
            {report.publishedAt ? formatDate(report.publishedAt) : report.verifiedAt ? `Verified ${formatDate(report.verifiedAt)}` : 'Draft Bench Report'}
          </span>
        </div>
      </div>

      {/* Main Grid: Analyte Results Table & Authenticity Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analyte Results Table & Impression */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Quantitative & Qualitative Analyte Measurements</h2>
                  <p className="text-xs text-ink-500">Laboratory findings compared against standardized reference intervals</p>
                </div>
                <Badge tone="slate" className="text-[10px]">
                  {report.analytes.length} Analytes
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="py-2.5 px-3">Test / Analyte</th>
                    <th className="py-2.5 px-3">Observed Result</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Reference Range</th>
                    <th className="py-2.5 px-3 text-right">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.analytes.map((a) => (
                    <tr key={a.name} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-ink-900 text-xs sm:text-sm">
                        {a.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-mono text-xs sm:text-sm font-bold ${
                          a.flag === 'C' ? 'text-rose-700' : a.flag ? 'text-amber-700' : 'text-ink-900'
                        }`}>
                          {a.value}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-ink-500">
                        {a.unit || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-ink-500">
                        {a.ref}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {getFlagBadge(a.flag)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Diagnostic Impression / Pathologist Interpretation */}
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-ink-900">Pathologist Diagnostic Impression & Comments</h2>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200/60">
              <p className="text-xs sm:text-sm leading-relaxed text-ink-800 whitespace-pre-line font-serif">
                {report.impression || 'Diagnostic interpretation and correlating clinical notes pending pathologist sign-off.'}
              </p>
            </div>
            {report.critical && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Critical Alert Advisory:</span> Panic values were flagged on this panel. Clinical guidelines mandate direct telephone verification with ordering physician Dr. {report.doctor} prior to outpatient release.
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Authenticity, Verifier Sign-off & Audit Log */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-ink-900">Sign-Off & Provenance</h2>
            </div>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-ink-400">Laboratory:</dt>
                <dd className="font-semibold text-ink-900">{labOrg.name}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-ink-400">CLIA Licensure:</dt>
                <dd className="font-mono text-ink-800">{labOrg.clia}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-ink-400">Pathologist Verifier:</dt>
                <dd className="font-semibold text-brand-800">{report.verifier || 'Pending Sign-Off'}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-ink-400">Verified Timestamp:</dt>
                <dd className="text-ink-800">{report.verifiedAt ? formatDate(report.verifiedAt) : '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-ink-400">Report Version:</dt>
                <dd className="font-mono font-semibold text-ink-900">v{report.version}.0</dd>
              </div>
            </dl>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Button to={paths.app.labVerify} variant="ghost" size="sm" className="w-full text-xs text-brand-700">
                Go to Verification Queue
              </Button>
            </div>
          </Card>

          {/* Audit Trail */}
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="h-4 w-4 text-ink-500" />
              <h2 className="text-sm font-semibold text-ink-900">Immutable Audit Trail</h2>
            </div>
            <div className="mt-4 space-y-3">
              {report.history.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-600 shrink-0" />
                  <div>
                    <p className="font-medium text-ink-900">{h.action}</p>
                    <p className="text-[11px] text-ink-400">{formatDate(h.at)} · {h.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
