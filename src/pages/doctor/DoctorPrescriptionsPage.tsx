import { useState } from 'react';
import { Pill, PlusCircle, Calendar, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import type { RxLine } from '../../types/doctor';
import { grantAllowsConsentCategory } from '../../../shared/consent-categories.js';
import { formatDate } from '../../utils/format';

interface GrantRow {
  id: string | number;
  patient_name: string;
  categories: string;
  status: string;
}

interface PrescriptionRow {
  id: string;
  medicine: string;
  dosage: string;
  duration: string;
  instructions: string;
  active?: boolean;
  refills_left?: number;
  issued: string;
  created_at: string;
}

export default function DoctorPrescriptionsPage() {
  const { session } = useAuth();
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const grants = (grantsQuery.data ?? []).filter(
    (grant) => grant.status === 'active' && grantAllowsConsentCategory(grant, 'prescription')
  );
  const [selectedGrantId, setSelectedGrantId] = useState('');
  const grantId = grants.some((grant) => String(grant.id) === selectedGrantId)
    ? selectedGrantId
    : String(grants[0]?.id ?? '');
  const prescriptionQuery = useAuthenticatedApi<PrescriptionRow[]>(
    `/api/prescriptions?grantId=${encodeURIComponent(grantId)}`,
    Boolean(grantId)
  );
  const [lines, setLines] = useState<RxLine[]>([emptyLine()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const patient = grants.find((grant) => String(grant.id) === grantId);
  const prescriptions = prescriptionQuery.data ?? [];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!grantId || !session?.access_token) {
      setError('Choose a patient with active prescription consent.');
      return;
    }
    const validLines = lines.filter((line) => line.medicine.trim());
    if (!validLines.length || validLines.some((line) => !line.dosage.trim() || !line.duration.trim())) {
      setError('Each medicine needs a dosage and duration.');
      return;
    }
    setSaving(true);
    const result = await safeApiFetch<PrescriptionRow[]>('/api/prescriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantId,
        lines: validLines.map((line) => ({
          ...line,
          instructions: [line.frequency, line.instructions].filter(Boolean).join('. '),
        })),
      }),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLines([emptyLine()]);
    await prescriptionQuery.refetch();
  };

  return (
    <>
      <Seo title="Prescriptions" description="Issue prescriptions to patients who granted prescription access." />
      <PatientPageHeader
        eyebrow="Clinical Pharmacy"
        title="Prescriptions"
        description="Issue verified prescription orders to patients with active medication consent. Orders are logged to the patient's record and routed to participating pharmacies."
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Consented Patients</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{grants.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Prescriptions for Patient</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{prescriptions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Active Regimens</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">
            {prescriptions.filter((p) => p.active !== false).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Consent Verification</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-700">Active</p>
        </div>
      </div>

      {grantsQuery.isError ? (
        <Alert tone="error" title="Access grants unavailable" className="mb-4">
          {grantsQuery.error?.message || 'Check your connection and retry.'}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" title="Prescription not saved" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {grantsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : null}

      {!grantsQuery.isLoading && !grantsQuery.isError && grants.length === 0 ? (
        <EmptyState
          title="No patients with prescription consent"
          description="Request patient access that includes prescriptions or medications before issuing an order."
          icon={Pill}
        />
      ) : null}

      {grants.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Order Pad Form (5 cols) */}
          <Card className="lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <PlusCircle className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-ink-900">New Prescription Order</h2>
            </div>

            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <Select
                label="Target Patient"
                value={grantId}
                onChange={(event) => setSelectedGrantId(event.target.value)}
                options={grants.map((grant) => ({
                  value: String(grant.id),
                  label: `${grant.patient_name || 'Patient'} (Grant #${grant.id})`,
                }))}
              />

              {lines.map((line, index) => (
                <div key={index} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                      Medication #{index + 1}
                    </span>
                  </div>

                  <Input
                    label="Medicine name"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={line.medicine}
                    onChange={(event) =>
                      setLines(lines.map((item, i) => (i === index ? { ...item, medicine: event.target.value } : item)))
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Dosage"
                      placeholder="e.g. 1 capsule"
                      value={line.dosage}
                      onChange={(event) =>
                        setLines(lines.map((item, i) => (i === index ? { ...item, dosage: event.target.value } : item)))
                      }
                    />
                    <Input
                      label="Duration"
                      placeholder="e.g. 10 days"
                      value={line.duration}
                      onChange={(event) =>
                        setLines(lines.map((item, i) => (i === index ? { ...item, duration: event.target.value } : item)))
                      }
                    />
                  </div>

                  <Input
                    label="Frequency"
                    placeholder="e.g. 3 times daily with food"
                    value={line.frequency}
                    onChange={(event) =>
                      setLines(lines.map((item, i) => (i === index ? { ...item, frequency: event.target.value } : item)))
                    }
                  />

                  <Input
                    label="Instructions"
                    placeholder="e.g. Take full course"
                    value={line.instructions}
                    onChange={(event) =>
                      setLines(lines.map((item, i) => (i === index ? { ...item, instructions: event.target.value } : item)))
                    }
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setLines([...lines, emptyLine()])}>
                  + Add Another Medicine
                </Button>
                <Button type="submit" disabled={saving || !grantId} loading={saving}>
                  Sign & Save Order
                </Button>
              </div>
            </form>
          </Card>

          {/* Prescription History Table (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-brand-700" />
                  <h2 className="text-sm font-semibold text-ink-900">
                    Prescription History {patient ? `· ${patient.patient_name || 'Patient'}` : ''}
                  </h2>
                </div>
                <span className="text-xs text-ink-400 font-medium">{prescriptions.length} orders</span>
              </div>

              {prescriptionQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : null}

              {prescriptionQuery.isError ? (
                <Alert tone="error" title="Prescription history unavailable">
                  {prescriptionQuery.error?.message || 'Check your connection and retry.'}
                </Alert>
              ) : null}

              {!prescriptionQuery.isLoading && !prescriptionQuery.isError && prescriptions.length === 0 ? (
                <EmptyState
                  title="No prescriptions yet"
                  description="Saved prescriptions for this patient will appear in this history table."
                  icon={Pill}
                />
              ) : null}

              {prescriptions.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        <tr>
                          <th className="px-3.5 py-2.5">Medication & Strength</th>
                          <th className="px-3.5 py-2.5">Duration</th>
                          <th className="px-3.5 py-2.5">Issued Date</th>
                          <th className="px-3.5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-ink-800">
                        {prescriptions.map((rx) => (
                          <tr key={rx.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-3.5 py-3 align-middle">
                              <p className="font-semibold text-ink-900">{rx.medicine}</p>
                              <p className="text-[11px] text-brand-700 font-medium">{rx.dosage}</p>
                              {rx.instructions ? (
                                <p className="text-[11px] text-ink-500 mt-0.5 max-w-xs truncate">{rx.instructions}</p>
                              ) : null}
                            </td>
                            <td className="px-3.5 py-3 align-middle text-xs text-ink-600 whitespace-nowrap">
                              {rx.duration}
                            </td>
                            <td className="px-3.5 py-3 align-middle text-xs text-ink-500 whitespace-nowrap">
                              {formatDate(rx.issued)}
                            </td>
                            <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                              <Badge tone={rx.active !== false ? 'emerald' : 'slate'} className="text-[10px]">
                                {rx.active !== false ? 'Active' : 'Completed'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

function emptyLine(): RxLine {
  return { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' };
}
