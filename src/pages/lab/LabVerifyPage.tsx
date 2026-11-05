import { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';

export default function LabVerifyPage() {
  const { reports, verifyReport, can } = useLabPortal();
  const { push } = useToast();
  const [query, setQuery] = useState('');

  const queue = reports
    .filter((r) => r.status === 'awaiting-verify' || r.status === 'draft')
    .filter((r) => `${r.title} ${r.patientName} ${r.reportId} ${r.doctor}`.toLowerCase().includes(query.toLowerCase()));

  const criticalCount = queue.filter((r) => r.critical).length;
  const verifiedCount = reports.filter((r) => r.status === 'verified' || r.status === 'published').length;

  if (!can('verify') && !can('all')) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Pathologist Credential Required"
        description="Only a board-certified clinical pathologist or laboratory director can sign off and certify diagnostic reports."
      />
    );
  }

  return (
    <>
      <Seo title="Pathologist Verification Queue" description="Authorize and certify release of laboratory diagnostic reports." />

      <PatientPageHeader
        title="Pathologist Verification Desk"
        description="Review analyte delta checks, confirm reference deviations, and digitally sign diagnostic panels under CLIA licensure."
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Awaiting Sign-Off</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{queue.length}</p>
          <p className="text-[11px] text-amber-600">Pending clinical signature</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Urgent Critical Values</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{criticalCount}</p>
          <p className="text-[11px] text-rose-600">Mandatory telephone notification</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Certified Reports</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{verifiedCount}</p>
          <p className="text-[11px] text-emerald-600">Signed & cleared for transmission</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter queue by patient name, report ID, panel, or prescriber..."
          leftIcon={<Search className="h-4 w-4 text-ink-400" />}
        />
      </div>

      {/* Verification Queue Table */}
      <Card className="overflow-hidden p-0">
        {queue.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={CheckCircle2}
              title="Verification Queue Clear"
              description="All submitted laboratory reports have been reviewed, verified, and certified by attending pathologists."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="py-2.5 px-3">Report ID / Version</th>
                  <th className="py-2.5 px-3">Diagnostic Panel</th>
                  <th className="py-2.5 px-3">Patient / Prescriber</th>
                  <th className="py-2.5 px-3">Analytes Measured</th>
                  <th className="py-2.5 px-3">Alert Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Pathologist Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                          {r.reportId}
                        </span>
                        <span className="font-mono text-[10px] text-ink-400">v{r.version}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-xs sm:text-sm">{r.title}</div>
                      <p className="text-[11px] text-ink-400 capitalize">{r.kind} panel</p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-ink-900 text-xs">{r.patientName}</div>
                      <div className="text-[11px] text-ink-500">Dr. {r.doctor}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-mono font-medium text-ink-700">{r.analytes.length} tests</span>
                      <span className="block text-[10px] text-ink-400">
                        {r.analytes.slice(0, 2).map((a) => a.name).join(', ')}
                        {r.analytes.length > 2 ? '...' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {r.critical ? (
                        <Badge tone="rose" className="text-[10px] font-bold">
                          CRITICAL PANIC
                        </Badge>
                      ) : (
                        <Badge tone="slate" className="text-[10px]">
                          Routine
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={r.status === 'awaiting-verify' ? 'brand' : 'amber'} className="capitalize text-[10px]">
                        {r.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          to={paths.app.labReport(r.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs"
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                          onClick={async () => {
                            if (!(await verifyReport(r.id, 'Dr. Ruth Adeyemi, MD'))) return;
                            push({
                              tone: 'success',
                              title: 'Diagnostic Report Verified',
                              description: `${r.reportId} v${r.version} signed under CLIA licensure.`,
                            });
                          }}
                        >
                          Sign & Certify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
