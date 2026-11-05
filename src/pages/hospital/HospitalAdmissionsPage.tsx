import { HospitalEntryForm } from '../../components/organization/HospitalEntryForm';
import { useState } from 'react';
import { Bed, Calendar, Stethoscope, LogOut, CheckCircle2, Building2 } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';
import type { AdmissionStatus } from '../../types/hospital';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';

const tones: Record<AdmissionStatus, 'brand' | 'sky' | 'amber' | 'emerald'> = {
  admitted: 'brand',
  observation: 'sky',
  'pending-discharge': 'amber',
  discharged: 'emerald',
};

export default function HospitalAdmissionsPage() {
  const { admits, patients, doctors, depts, updateAdmission, can } = useHospitalPortal();
  const [filter, setFilter] = useState<string>('all');

  if (!can('admissions') && !can('all')) {
    return (
      <EmptyState
        title="Restricted Access"
        description="Inpatient admissions and bed management are limited to authorized nursing and administration staff."
      />
    );
  }

  const occupancy = [...new Set(admits.map(row => row.room))].map(room => ({floor: room, used: admits.filter(row => row.room === room && row.status !== 'discharged').length, total: new Set(admits.filter(row => row.room === room).map(row => row.bed)).size}));
  const activeAdmits = admits.filter((a) => {
    if (filter === 'all') return a.status !== 'discharged';
    return a.status === filter;
  });

  return (
    <>
      <Seo title="Inpatient Admissions" description="In-house census and inpatient bed tracking." />
      <PatientPageHeader
        eyebrow="Inpatient Care"
        title="Inpatient admissions & census"
        description="Live bed management, ward assignments, attending clinician orders, and discharge workflow."
      />
      <HospitalEntryForm kind="admissions" />

      {/* Floor Capacity Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {occupancy.map((row) => {
          const pct = Math.round((row.used / row.total) * 100);
          return (
            <div
              key={row.floor}
              className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{row.floor}</p>
              <p className="font-display text-2xl font-bold text-ink-900 mt-0.5">{row.used}</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-ink-400">
                <span>of {row.total} beds</span>
                <span className="font-bold text-brand-700">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All In-House' },
          { id: 'admitted', label: 'Admitted' },
          { id: 'observation', label: 'Observation Unit' },
          { id: 'pending-discharge', label: 'Pending Discharge' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
              filter === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Structured Inpatient Admissions Table */}
      {activeAdmits.length === 0 ? (
        <EmptyState
          title="No admissions in this view"
          description="There are currently no patients under the selected admission status filter."
          icon={Bed}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Ward / Bed</th>
                  <th className="px-4 py-3">Patient Profile</th>
                  <th className="px-4 py-3">Department & Attending</th>
                  <th className="px-4 py-3">Dates (Admitted / Exp. DC)</th>
                  <th className="px-4 py-3">Diagnosis / Indication</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Discharge Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-ink-800">
                {activeAdmits.map((a) => {
                  const p = patients.find((x) => x.id === a.patientId);
                  const d = doctors.find((x) => x.id === a.doctorId);
                  const dep = depts.find((x) => x.id === a.departmentId);

                  return (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-brand-700 font-bold text-xs border border-teal-100">
                            <Bed className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-ink-900 text-xs">Room {a.room}</span>
                            <span className="block text-[11px] text-ink-400">Bed {a.bed}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-semibold text-ink-900">{p?.name || 'Patient'}</p>
                        <p className="text-[11px] font-mono text-ink-400">MRN: {p?.mrn || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs">
                        <p className="font-medium text-ink-900">{dep?.name || 'General Wing'}</p>
                        <p className="text-[11px] text-ink-500">{d?.name || 'Attending'}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        <p className="text-ink-700">In: {formatDate(a.admitted)}</p>
                        <p className="text-[11px] text-ink-400">Exp DC: {formatDate(a.expected)}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs truncate">
                        {a.reason}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <Badge tone={tones[a.status] || 'slate'}>
                          {a.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        {a.status === 'admitted' || a.status === 'observation' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAdmission({ ...a, status: 'pending-discharge' })}
                          >
                            Ready for DC
                          </Button>
                        ) : null}
                        {a.status === 'pending-discharge' ? (
                          <Button size="sm" variant="primary" to={paths.app.hospitalDischarge}>
                            Summary
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
