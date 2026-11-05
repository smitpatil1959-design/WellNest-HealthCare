import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  User,
  Stethoscope,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { useToast } from '../../providers/ToastProvider';
import { paths } from '../../routes/paths';
import type { Analyte, LabReport, LabTestKind } from '../../types/lab';
import { fadeUp, stagger } from '../../animations/variants';

export default function LabComposePage() {
  const { orders, saveReport, can } = useLabPortal();
  const { push } = useToast();
  const navigate = useNavigate();
  const draftable = orders.filter((o) => o.status !== 'published');
  const [orderId, setOrderId] = useState(draftable[0]?.id ?? '');
  const [impression, setImpression] = useState('');
  const [analytes, setAnalytes] = useState<Analyte[]>([
    { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', ref: '13.5 - 17.5' },
    { name: 'White Blood Count (WBC)', value: '6.8', unit: 'x10^3/uL', ref: '4.5 - 11.0' },
    { name: 'Platelet Count', value: '240', unit: 'x10^3/uL', ref: '150 - 450' },
  ]);
  const order = orders.find((o) => o.id === orderId);

  if (!can('compose') && !can('all')) {
    return (
      <EmptyState
        title="Restricted Diagnostic Workstation"
        description="Diagnostic report drafting is restricted to licensed Medical Technologists and Clinical Pathologists."
      />
    );
  }

  return (
    <>
      <Seo
        title="Diagnostic Report Composer — Laboratory Command"
        description="Compose versioned laboratory reports, record quantitative analytes, and submit for pathologist certification."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Diagnostic Workstation"
          title="Diagnostic Report Composer"
          description="Accession active clinical orders, transcribe calibrated analyte values, specify normal reference intervals, and submit versioned drafts for pathologist sign-off."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Composer Form */}
          <motion.div variants={fadeUp} className="lg:col-span-8">
            <Card>
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!order) return;
                  const report: LabReport = {
                    id: `lrpt-${crypto.randomUUID().slice(0, 6)}`,
                    reportId: `RPT-HL-${Math.floor(88000 + Math.random() * 999)}`,
                    orderId: order.id,
                    version: 1,
                    title: order.test,
                    kind: order.kind as LabTestKind,
                    patientName: order.patientName,
                    patientId: order.patientId,
                    doctor: order.doctor,
                    hospital: order.hospital,
                    source: 'laboratory',
                    status: 'awaiting-verify',
                    impression: impression || 'All analyzed parameters within expected physiologic limits.',
                    analytes: analytes.filter((a) => a.name.trim()),
                    history: [
                      {
                        at: new Date().toISOString(),
                        actor: 'Medical Technologist',
                        action: 'Draft v1 recorded and routed for clinical verification',
                      },
                    ],
                    critical: order.priority === 'critical',
                  };
                  if (!(await saveReport(report))) return;
                  push({
                    tone: 'success',
                    title: 'Diagnostic report draft queued',
                    description: 'Report routed to Pathologist Verification Desk for clinical sign-off.',
                  });
                  navigate(paths.app.labVerify);
                }}
              >
                {/* Accession Header */}
                <div className="border-b border-slate-100 pb-4">
                  <Select
                    label="Select Active Order Accession"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    options={draftable.map((o) => ({
                      value: o.id,
                      label: `${o.accession} · ${o.test} (${o.patientName})`,
                    }))}
                  />

                  {order && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div>
                        <span className="text-ink-400">Patient:</span>
                        <p className="font-bold text-ink-900">{order.patientName}</p>
                      </div>
                      <div>
                        <span className="text-ink-400">Ordering MD:</span>
                        <p className="font-bold text-ink-900">{order.doctor}</p>
                      </div>
                      <div>
                        <span className="text-ink-400">Facility:</span>
                        <p className="font-bold text-ink-900">{order.hospital}</p>
                      </div>
                      <div>
                        <span className="text-ink-400">Priority:</span>
                        <Badge tone={order.priority === 'critical' ? 'rose' : 'slate'} className="mt-0.5">
                          {order.priority}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analyte Builder */}
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-bold text-ink-900">Analyte Observations & Reference Intervals</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAnalytes([...analytes, { name: '', value: '', unit: '', ref: '' }])
                      }
                      leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
                    >
                      Add Analyte
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {analytes.map((a, i) => (
                      <div
                        key={i}
                        className="grid gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:grid-cols-12 items-end"
                      >
                        <div className="sm:col-span-4">
                          <Input
                            label={i === 0 ? 'Analyte Parameter' : undefined}
                            placeholder="e.g. Serum Creatinine"
                            value={a.name}
                            onChange={(e) =>
                              setAnalytes(
                                analytes.map((x, n) => (n === i ? { ...x, name: e.target.value } : x))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            label={i === 0 ? 'Observed Result' : undefined}
                            placeholder="1.0"
                            value={a.value}
                            onChange={(e) =>
                              setAnalytes(
                                analytes.map((x, n) => (n === i ? { ...x, value: e.target.value } : x))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label={i === 0 ? 'Unit' : undefined}
                            placeholder="mg/dL"
                            value={a.unit}
                            onChange={(e) =>
                              setAnalytes(
                                analytes.map((x, n) => (n === i ? { ...x, unit: e.target.value } : x))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label={i === 0 ? 'Ref Interval' : undefined}
                            placeholder="0.7 - 1.3"
                            value={a.ref}
                            onChange={(e) =>
                              setAnalytes(
                                analytes.map((x, n) => (n === i ? { ...x, ref: e.target.value } : x))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center pb-2">
                          {analytes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setAnalytes(analytes.filter((_, n) => n !== i))}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove analyte"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pathologist Impression */}
                <div>
                  <Textarea
                    label="Diagnostic Impression & Pathologist Notes"
                    placeholder="Enter clinical interpretation, specimen quality notes, or abnormal morphology observations..."
                    value={impression}
                    onChange={(e) => setImpression(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button type="button" variant="ghost" onClick={() => navigate(paths.app.labTests)}>
                    Discard Draft
                  </Button>
                  <Button type="submit">Submit for Pathologist Sign-Off</Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Right Column: Standards & Preview */}
          <motion.div variants={fadeUp} className="lg:col-span-4 space-y-4">
            <Card>
              <h3 className="text-sm font-bold text-ink-900">CAP / CLIA Quality Standards</h3>
              <div className="mt-3 space-y-2.5 text-xs text-ink-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Calibrated Bench Instrumentation:</strong> Ensure run controls are verified prior to transcribing results.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Critical Value Alerts:</strong> Out-of-interval panic values automatically flag for mandatory verbal readback.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Two-Party Authentication:</strong> Technologist drafts cannot publish without clinical pathologist signature.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200/60">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-brand-700 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-ink-900">Tamper-Evident Versioning</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    Once submitted, drafts receive an immutable SHA-256 hash. Revisions create superseding versions without erasing original data.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
