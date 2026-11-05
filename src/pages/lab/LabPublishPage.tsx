import { motion } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  FlaskConical,
  Building2,
  User,
  ExternalLink,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { useToast } from '../../providers/ToastProvider';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

const steps = ['Verified by Pathologist', 'Hospital Central Notified', 'Attending MD Review', 'Committed to Lifetime Timeline', 'Patient Push Dispatched'];

export default function LabPublishPage() {
  const { reports, publishReport, can } = useLabPortal();
  const { push } = useToast();
  const ready = reports.filter((r) => r.status === 'verified');
  const published = reports.filter((r) => r.status === 'published');

  return (
    <>
      <Seo
        title="Diagnostic Report Publication — Laboratory Command"
        description="Release verified clinical pathology reports directly into patient universal timelines."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Release & Distribution"
          title="Patient & Hospital Report Publishing"
          description="Review verified report versions before release to the patient's laboratory reports. Attached files must pass scanning before release."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Ready to Publish"
            value={ready.length}
            icon={Clock}
            subtext="Pathologist signed"
          />
          <StatTile
            label="Published Today"
            value={published.length}
            icon={CheckCircle2}
            subtext="Live on patient charts"
          />
          <StatTile
            label="Distribution Protocol"
            value="Federated"
            icon={ShieldCheck}
            subtext="Zero intermediate leakage"
          />
          <StatTile
            label="Push Notification"
            value="Automated"
            icon={Send}
            subtext="Real-time alerts"
          />
        </motion.div>

        {/* Pipeline Bar */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-50/70 border-slate-200/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
              Diagnostic Release & Federated Synchronization Protocol
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-2xs">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <span>{s}</span>
                  </span>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Ready to Publish Queue */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-900">
              Verified Diagnostic Queue ({ready.length})
            </h3>
            <span className="text-xs text-ink-400">Immediate broadcast available</span>
          </div>

          {ready.length === 0 ? (
            <EmptyState
              title="No reports awaiting publication"
              description="When clinical pathologists sign and certify diagnostic panels in the Verification Queue, they will queue here for final release."
            >
              <Button to={paths.app.labVerify} variant="outline" size="sm" className="mt-4">
                Open Pathologist Verification Desk
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {ready.map((r) => (
                <Card key={r.id} hover className="transition-all">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-ink-900">{r.title}</h4>
                          <span className="font-mono text-xs text-ink-500 font-semibold">
                            {r.reportId}
                          </span>
                          <Badge tone="emerald" className="text-[10px]">
                            Pathologist Certified
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-600">
                          Patient: <strong className="text-ink-900">{r.patientName}</strong> · Ordering Clinician: {r.doctor} · {r.hospital}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          Certified by: {r.verifier || 'Staff Clinical Pathologist'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                      {can('publish') || can('all') ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!(await publishReport(r.id))) return;
                            push({
                              tone: 'success',
                              title: 'Report committed to lifetime timeline',
                              description: `${r.patientName}'s report is available in the patient portal.`,
                            });
                          }}
                          leftIcon={<Send className="h-4 w-4" />}
                        >
                          Publish to Patient Timeline
                        </Button>
                      ) : (
                        <Badge tone="slate">Technologist: Read Only</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
  icon: typeof Clock;
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
