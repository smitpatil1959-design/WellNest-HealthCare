import { useMemo, useState } from 'react';
import { Search, UserPlus, Users, Bed, Stethoscope, ChevronRight } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';

export default function HospitalPatientsPage() {
  const { patients, admits, doctors, depts, can } = useHospitalPortal();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const cities = ['all', ...Array.from(new Set(patients.map((p) => p.city)))];

  const inHouseAdmits = admits.filter((a) => a.status !== 'discharged');
  const inHouseCount = inHouseAdmits.length;

  const enrichedPatients = useMemo(() => {
    return patients.map((p) => {
      const activeAdmit = admits.find((a) => a.patientId === p.id && a.status !== 'discharged');
      const attending = activeAdmit ? doctors.find((d) => d.id === activeAdmit.doctorId) : undefined;
      const dept = activeAdmit ? depts.find((d) => d.id === activeAdmit.departmentId) : undefined;
      return {
        ...p,
        activeAdmit,
        attending,
        dept,
        status: activeAdmit ? activeAdmit.status : 'outpatient',
      };
    });
  }, [patients, admits, doctors, depts]);

  const filtered = useMemo(() => {
    return enrichedPatients.filter((p) => {
      const hay = `${p.name} ${p.mrn} ${p.phone} ${p.city}`.toLowerCase();
      const matchesQuery = hay.includes(query.toLowerCase());
      const matchesCity = city === 'all' || p.city === city;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'inpatient'
            ? p.activeAdmit !== undefined
            : p.activeAdmit === undefined;
      return matchesQuery && matchesCity && matchesStatus;
    });
  }, [enrichedPatients, query, city, statusFilter]);

  const size = 6;
  const slice = filtered.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(filtered.length / size));

  if (!can('patients')) {
    return (
      <EmptyState
        title="Access Restricted"
        description="Your hospital staff role does not have authorization to open the central patient directory."
      />
    );
  }

  return (
    <>
      <Seo title="Patients Directory" description="Hospital patient directory and admission tracking." />
      <PatientPageHeader
        eyebrow="Master Patient Index"
        title="Patient directory"
        description="Search, triage, and review patient medical records, active bed admissions, and clinical histories."
        action={
          can('register') || can('all') ? (
            <Button to={paths.app.hospitalRegister} size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
              Register New Patient
            </Button>
          ) : null
        }
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Registered</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{patients.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Currently Admitted</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{inHouseCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Outpatients</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">
            {patients.length - inHouseCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Filtered Results</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{filtered.length}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name, MRN, phone..."
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(0);
          }}
          options={cities.map((c) => ({ value: c, label: c === 'all' ? 'All Cities' : c }))}
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          options={[
            { value: 'all', label: 'All Inpatients & Outpatients' },
            { value: 'inpatient', label: 'Inpatients (Admitted)' },
            { value: 'outpatient', label: 'Outpatients' },
          ]}
        />
      </div>

      {/* Structured Patients Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No patients match filters"
          description="Try adjusting your search criteria or register a new patient."
          icon={Users}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Patient Profile</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Ward / Bed Assignment</th>
                  <th className="px-4 py-3">Attending Physician</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-ink-800">
                {slice.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} src={p.avatar} size="sm" />
                        <div>
                          <p className="font-semibold text-ink-900">{p.name}</p>
                          <p className="text-[11px] font-mono text-ink-400">MRN: {p.mrn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-600">
                      <p>{p.age} yrs · {p.city}</p>
                      {p.bloodGroup ? (
                        <span className="inline-block font-semibold text-rose-700 text-[10px] bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
                          {p.bloodGroup}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-700">
                      {p.activeAdmit ? (
                        <div>
                          <p className="font-semibold text-ink-900">
                            Room {p.activeAdmit.room} · Bed {p.activeAdmit.bed}
                          </p>
                          <p className="text-[11px] text-ink-400">{p.dept?.name || 'General Wing'}</p>
                        </div>
                      ) : (
                        <span className="text-ink-400 italic">No active admission</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs text-ink-700">
                      {p.attending ? (
                        <p className="font-medium text-ink-900">{p.attending.name}</p>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <Badge
                        tone={
                          p.activeAdmit
                            ? p.activeAdmit.status === 'pending-discharge'
                              ? 'amber'
                              : 'brand'
                            : 'slate'
                        }
                        className="capitalize"
                      >
                        {p.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                      <Button to={paths.app.hospitalPatient(p.id)} size="sm" variant="outline">
                        Chart <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between text-xs font-medium">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((n) => n - 1)}
        >
          Previous
        </Button>
        <span className="text-ink-500">
          Page {page + 1} of {pages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page + 1 >= pages}
          onClick={() => setPage((n) => n + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
