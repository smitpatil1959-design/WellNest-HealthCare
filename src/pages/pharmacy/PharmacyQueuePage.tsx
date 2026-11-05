import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { RxSource, RxStatus } from '../../types/pharmacy';

export default function PharmacyQueuePage() {
  const { scripts, can } = usePharmacyPortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RxStatus | 'all'>('all');
  const [source, setSource] = useState<RxSource | 'all'>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return scripts.filter((rx) => {
      const hay = `${rx.patientName} ${rx.medicine} ${rx.rxNumber} ${rx.doctor}`.toLowerCase();
      return (
        hay.includes(query.toLowerCase()) &&
        (status === 'all' || rx.status === status) &&
        (source === 'all' || rx.source === source)
      );
    });
  }, [scripts, query, status, source]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: scripts.length,
      pending: scripts.filter((s) => s.status === 'pending').length,
      processing: scripts.filter((s) => s.status === 'processing' || s.status === 'verifying').length,
      ready: scripts.filter((s) => s.status === 'ready').length,
    };
  }, [scripts]);

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'completed':
        return 'emerald';
      case 'ready':
        return 'brand';
      case 'processing':
      case 'verifying':
        return 'sky';
      case 'pending':
        return 'amber';
      case 'cancelled':
        return 'rose';
      default:
        return 'slate';
    }
  };

  if (!can('queue') && !can('all')) {
    return (
      <EmptyState
        icon={Pill}
        title="Restricted Prescription Queue"
        description="Only licensed clinical pharmacists and certified technicians hold permission to access the active dispensing queue."
      />
    );
  }

  return (
    <>
      <Seo title="Prescription Queue" description="Incoming signed and authorized electronic prescriptions." />

      <PatientPageHeader
        title="Prescription Fulfillment Queue"
        description="Verify physician digital credentials, perform drug utilization review (DUR), and dispense medications."
        action={
          <Button to={paths.app.pharmacyVerify} size="sm" leftIcon={<FileCheck2 className="h-4 w-4" />}>
            Open Verification Desk
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Total Rx Orders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Pill className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">All received prescriptions</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Pending Review</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.pending}</p>
          <p className="text-[11px] text-amber-600">Awaiting clinical verification</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">In Preparation</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Pill className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.processing}</p>
          <p className="text-[11px] text-sky-600">Counting & label affixing</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Ready for Patient</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{stats.ready}</p>
          <p className="text-[11px] text-emerald-600">Staged for counter dispense</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search patient, Rx #, medicine, prescriber..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Lifecycle Statuses' },
              { value: 'pending', label: 'Pending Verification' },
              { value: 'verifying', label: 'Under Review' },
              { value: 'processing', label: 'Processing / Counting' },
              { value: 'ready', label: 'Ready for Pickup' },
              { value: 'completed', label: 'Completed & Dispensed' },
              { value: 'cancelled', label: 'Cancelled / Rejected' },
            ]}
          />
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as typeof source);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Prescription Sources' },
              { value: 'doctor', label: 'Physician E-Prescribe' },
              { value: 'hospital', label: 'Hospital Inpatient Discharge' },
              { value: 'patient', label: 'Patient Uploaded Document' },
            ]}
          />
        </div>
      </Card>

      {/* Prescription Queue Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Pill}
              title="No prescriptions found"
              description="No prescription orders match your search criteria or active status filter."
            >
              {(query || status !== 'all' || source !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setSource('all');
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="py-2.5 px-3">Rx Number</th>
                  <th className="py-2.5 px-3">Medication & Regimen</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Prescriber / Facility</th>
                  <th className="py-2.5 px-3">Source Origin</th>
                  <th className="py-2.5 px-3">Dispense Status</th>
                  <th className="py-2.5 px-3">Written</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {rx.rxNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-sm">{rx.medicine}</div>
                      <p className="text-[11px] text-ink-500">{rx.dosage || rx.sig || 'Standard regimen'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-ink-900 text-xs">{rx.patientName}</div>
                      <span className="font-mono text-[10px] text-ink-400">ID: {rx.patientId.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs text-ink-800">Dr. {rx.doctor}</div>
                      <span className="text-[10px] text-ink-400">{rx.hospital || 'Outpatient Clinic'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        tone={rx.source === 'patient' ? 'amber' : 'emerald'}
                        className="text-[10px]"
                      >
                        {rx.source === 'patient' ? 'Patient Photo' : 'Verified E-Rx'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getStatusTone(rx.status)} className="capitalize text-[10px]">
                        {rx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(rx.written)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        to={paths.app.pharmacyRx(rx.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-brand-700 hover:text-brand-900 hover:bg-brand-50"
                        rightIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        Process
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-ink-500">
              Showing <span className="font-semibold text-ink-800">{page * size + 1}</span> to{' '}
              <span className="font-semibold text-ink-800">{Math.min((page + 1) * size, rows.length)}</span> of{' '}
              <span className="font-semibold text-ink-800">{rows.length}</span> prescriptions
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 text-ink-600 font-medium">
                {page + 1} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page + 1 >= pages}
                onClick={() => setPage((n) => n + 1)}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
