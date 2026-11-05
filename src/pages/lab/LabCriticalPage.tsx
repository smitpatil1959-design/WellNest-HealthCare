import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  FileCheck2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { formatDate } from '../../utils/format';

export default function LabCriticalPage() {
  const { reports, verifyReport, publishReport } = useLabPortal();
  const { push } = useToast();
  const rows = reports.filter((r) => r.critical && r.status !== 'superseded');

  const awaitingVerifyCount = rows.filter((r) => r.status === 'awaiting-verify').length;
  const readyPublishCount = rows.filter((r) => r.status === 'verified').length;
  const publishedCount = rows.filter((r) => r.status === 'published').length;

  return (
    <>
      <Seo title="Critical Laboratory Results Desk" description="STAT and critical panic value notifications." />

      <PatientPageHeader
        title="Critical Panic Values Desk"
        description="Immediate clinical escalation desk for life-threatening analyte values requiring direct verbal readback to ordering physicians."
      />

      {/* CLIA Mandatory Protocol Banner */}
      <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-rose-950 text-sm">Mandatory CAP / CLIA Verbal Readback Protocol</h3>
            <p className="mt-1 leading-relaxed text-rose-800">
              Federal clinical standards mandate that panic critical values must be verbally telephoned to the licensed attending provider within 60 minutes of instrumentation confirmation. Confirm identity and require verbal readback of analyte name and numerical measurement before publishing to the patient portal.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Active Critical Panics</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{rows.length}</p>
          <p className="text-[11px] text-rose-600">Specimens flagged with panic values</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Awaiting Pathologist Sign-Off</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{awaitingVerifyCount}</p>
          <p className="text-[11px] text-amber-600">Must be signed prior to physician release</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Call Completed & Ready</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{readyPublishCount}</p>
          <p className="text-[11px] text-emerald-600">Pending final electronic release</p>
        </div>
      </div>

      {/* Critical Queue List */}
      {rows.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={CheckCircle2}
            title="Zero Panic Values Active"
            description="All diagnostic specimens currently on the laboratory bench fall within acceptable clinical safety margins."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} className="border-rose-200 bg-gradient-to-r from-rose-50/30 via-white to-white shadow-xs">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="rose" className="font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> STAT Critical
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-ink-600">{r.reportId}</span>
                    <Badge tone={r.status === 'published' ? 'emerald' : r.status === 'verified' ? 'brand' : 'amber'} className="capitalize text-[10px]">
                      {r.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-ink-900">{r.title}</h2>
                    <p className="text-xs text-ink-600">
                      Patient: <span className="font-bold text-ink-900">{r.patientName}</span> · Ordering Physician:{' '}
                      <span className="font-semibold text-ink-900">Dr. {r.doctor}</span> ({r.hospital})
                    </p>
                  </div>

                  {/* Analytes Flagged */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.analytes
                      .filter((a) => a.flag === 'C' || a.flag === 'H')
                      .map((a) => (
                        <div
                          key={a.name}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-100/70 px-2.5 py-1 text-xs text-rose-900"
                        >
                          <span className="font-semibold">{a.name}:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {a.value} {a.unit}
                          </span>
                          <span className="text-[10px] text-rose-600 font-normal">(Ref: {a.ref})</span>
                        </div>
                      ))}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-ink-700 border border-slate-200/60">
                    <span className="font-semibold text-ink-900">Impression: </span>
                    {r.impression}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-row flex-wrap lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                  <Button to={paths.app.labReport(r.id)} variant="outline" size="sm" className="h-8 text-xs">
                    Inspect Report
                  </Button>

                  {r.status === 'awaiting-verify' && (
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      leftIcon={<FileCheck2 className="h-3.5 w-3.5" />}
                      onClick={async () => {
                        if (!(await verifyReport(r.id, 'Dr. Ruth Adeyemi, MD'))) return;
                        push({
                          tone: 'success',
                          title: 'Critical Report Verified',
                          description: 'Pathologist signature affixed. Please proceed to phone attending provider.',
                        });
                      }}
                    >
                      Verify as Pathologist
                    </Button>
                  )}

                  {r.status === 'verified' && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                      leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                      onClick={async () => {
                        if (!(await publishReport(r.id))) return;
                        push({
                          tone: 'success',
                          title: 'Critical report released',
                          description: 'The report is available in the patient’s laboratory records.',
                        });
                      }}
                    >
                      Release critical report
                    </Button>
                  )}

                  {r.status === 'published' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Released to Chart
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
