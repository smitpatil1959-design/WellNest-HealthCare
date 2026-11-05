import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { paths } from '../../routes/paths';

interface GrantRow { id: string | number; patient_name: string; categories: string; status: string; expires_at: string | null }
interface RecordRow { id: string }

export default function ConsultationPage() {
  const { grantId = '' } = useParams();
  const { session } = useAuth();
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const grant = (grantsQuery.data ?? []).find((item) => String(item.id) === grantId && item.status === 'active');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSavedSuccess(false);
    if (!grant || !session?.access_token) { setError('An active consent grant and authenticated session are required.'); return; }
    if (![subjective, objective, assessment, plan].some((section) => section.trim())) {
      setError('Complete at least one SOAP note section before saving.');
      return;
    }
    const soapSummary = [
      ['Subjective', subjective],
      ['Objective', objective],
      ['Assessment', assessment],
      ['Plan', plan],
    ]
      .filter(([, content]) => content.trim())
      .map(([label, content]) => `${label}: ${content.trim()}`)
      .join('\n\n');
    setSaving(true);
    const result = await safeApiFetch<{ success: boolean; record: RecordRow }>('/api/records', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantId,
        title: assessment.trim() || 'Visit note',
        category: 'visit',
        status: 'signed',
        summary: soapSummary,
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setSavedSuccess(true);
  };

  if (grantsQuery.isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (grantsQuery.isError) return <Alert tone="error" title="Consent status unavailable">{grantsQuery.error?.message || 'Check your connection and retry.'}</Alert>;
  if (!grant) return <EmptyState title="No active consent" description="A patient must grant your verified account access to clinical history before you can write a visit note." />;

  return (
    <>
      <Seo title="Visit note" description="Save a visit note for a patient with active consent." />
      <PatientPageHeader
        eyebrow="Consented Clinical Consultation · SOAP Note"
        title={grant.patient_name || 'Patient Consultation'}
        description={`Document the encounter in a structured SOAP format. This note is saved to the patient's record under active consent${grant.expires_at ? ` valid until ${new Date(grant.expires_at).toLocaleString()}` : ''}.`}
      />
      {error ? <Alert tone="error" title="Visit note not saved" className="mb-4">{error}</Alert> : null}
      {savedSuccess ? (
        <Alert tone="success" title="Encounter note signed & saved" className="mb-4">
          The consultation note was successfully committed to the patient's record.
        </Alert>
      ) : null}
      <Card className="mx-auto max-w-3xl">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-ink-900">SOAP encounter note</h2>
          <p className="text-xs text-ink-500">Document patient-reported history, findings, assessment, and plan</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <Textarea
            label="Subjective"
            value={subjective}
            onChange={(event) => setSubjective(event.target.value)}
            placeholder="Patient-reported symptoms, history, and concerns"
            rows={3}
          />
          <Textarea
            label="Objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Observed findings and examination results"
            rows={3}
          />
          <Textarea
            label="Assessment"
            value={assessment}
            onChange={(event) => setAssessment(event.target.value)}
            placeholder="Clinical assessment or diagnosis"
            rows={3}
          />
          <Textarea
            label="Plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            placeholder="Treatment, recommendations, and follow-up plan"
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
            <Button type="submit" disabled={saving}>
              {saving ? 'Signing & Saving…' : 'Save & Sign Visit Note'}
            </Button>
            <Button type="button" variant="outline" to={paths.app.doctorPatient(grantId)}>
              Return to Patient Chart
            </Button>
          </div>
        </form>
      </Card>
      <p className="mt-5 text-center text-xs text-ink-400">
        <Link to={paths.app.doctorPatients} className="font-semibold text-brand-700 hover:text-brand-800">
          ← Back to patient panel
        </Link>
      </p>
    </>
  );
}
