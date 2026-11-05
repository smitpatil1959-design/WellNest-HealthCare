import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { downloadMedicalRecordPdf } from '../../utils/medicalRecordPdf';

interface SharedRecord { id: string; title: string; category: string; status: string; date: string; hospital: string | null; doctor: string | null; laboratory: string | null; summary: string | null }
interface SharedResponse { success: boolean; record: SharedRecord }

export default function SharedReportPage() {
  const { shareId = '' } = useParams();
  const query = useAuthenticatedApi<SharedResponse>(`/api/record-share?shareId=${encodeURIComponent(shareId)}`);
  const record = query.data?.record;
  return <>
    <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
      {!record ? <EmptyState title="Shared report unavailable" description="The recipient account must match the active patient authorization, and the share must not be expired or revoked." /> : <>
        <Seo title={record.title} description="Patient-authorized shared report." />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase text-brand-600">Patient-authorized report</p><h1 className="mt-2 font-display text-3xl text-ink-900">{record.title}</h1></div>
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadMedicalRecordPdf(record)}>Download PDF</Button>
        </div>
        <Card className="mt-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-400">Category</dt><dd className="font-medium capitalize text-ink-900">{record.category}</dd></div>
            <div><dt className="text-ink-400">Status</dt><dd className="font-medium capitalize text-ink-900">{record.status}</dd></div>
            <div><dt className="text-ink-400">Date</dt><dd className="font-medium text-ink-900">{record.date}</dd></div>
            <div><dt className="text-ink-400">Hospital</dt><dd className="font-medium text-ink-900">{record.hospital || 'Not recorded'}</dd></div>
            <div><dt className="text-ink-400">Doctor</dt><dd className="font-medium text-ink-900">{record.doctor || 'Not recorded'}</dd></div>
            <div><dt className="text-ink-400">Laboratory</dt><dd className="font-medium text-ink-900">{record.laboratory || 'Not recorded'}</dd></div>
          </dl>
          <div className="mt-5 border-t border-line pt-4"><h2 className="font-semibold text-ink-900">Summary</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{record.summary || 'No structured summary is available.'}</p></div>
        </Card>
      </>}
    </AuthenticatedApiState>
  </>;
}
