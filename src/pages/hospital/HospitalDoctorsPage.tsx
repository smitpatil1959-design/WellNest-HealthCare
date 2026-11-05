import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Building2,
  Users,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  Filter,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import type { DoctorAccountStatus } from '../../types/hospital';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalDoctorsPage() {
  const { doctors, depts, upsertDoctor, can } = useHospitalPortal();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Internal Medicine');
  const [departmentId, setDepartmentId] = useState(depts[0]?.id ?? 'dep-im');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const onCampusCount = doctors.filter((d) => d.available).length;
  const activeCount = doctors.filter((d) => d.status === 'active').length;
  const totalPatientsToday = doctors.reduce((acc, d) => acc + (d.patientsToday || 0), 0);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch = `${doc.name} ${doc.specialty || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'all' || doc.departmentId === deptFilter;
      return matchSearch && matchDept;
    });
  }, [doctors, searchTerm, deptFilter]);

  return (
    <>
      <Seo
        title="Medical Staff & Attending Roster — Hospital Command"
        description="Verify, credential, assign clinical departments, and manage physician availability."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Medical Staff Office"
          title="Physician & Attending Roster"
          description="Manage institutional credentialing, departmental service lines, inpatient rounds, and live on-campus availability for hospital medical staff."
          action={
            can('all') ? (
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                {showAddForm ? 'Close Form' : 'Credential Physician'}
              </Button>
            ) : undefined
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Medical Staff"
            value={doctors.length}
            icon={Stethoscope}
            subtext="Credentialed physicians"
          />
          <StatTile
            label="On-Campus / Active"
            value={onCampusCount}
            icon={UserCheck}
            subtext="Available for rounds"
          />
          <StatTile
            label="Clinical Service Lines"
            value={depts.length}
            icon={Building2}
            subtext="Active departments"
          />
          <StatTile
            label="Inpatients Assigned"
            value={totalPatientsToday}
            icon={Users}
            subtext="Today's patient census"
          />
        </motion.div>

        {/* Add Physician Form Drawer/Card */}
        {can('all') && showAddForm ? (
          <motion.div variants={fadeUp}>
            <Card className="border-brand-200/80 bg-brand-50/20">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Credential New Attending Physician</h2>
                <p className="text-xs text-ink-500">
                  Register doctor profile, assign primary department, and grant hospital electronic orders authority
                </p>
              </div>
              <form
                className="mt-4 grid gap-3 sm:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!name.trim()) return;
                  const saved = await upsertDoctor({
                    id: `hd-${crypto.randomUUID().slice(0, 5)}`,
                    name,
                    specialty,
                    departmentId,
                    npi: 'pending',
                    phone: '',
                    status: 'pending',
                    avatar: '/images/portrait-dr-chen.jpg',
                    available: true,
                    patientsToday: 0,
                  });
                  if (!saved) return;
                  setName('');
                  setShowAddForm(false);
                }}
              >
                <Input
                  label="Physician Full Name"
                  placeholder="Dr. Eleanor Vance, MD"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Specialty / Fellowship"
                  placeholder="Cardiology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
                <Select
                  label="Department Assignment"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  options={depts.map((d) => ({ value: d.id, label: d.name }))}
                />
                <div className="flex items-end">
                  <Button type="submit" fullWidth>
                    Grant Credentials
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : null}

        {/* Search & Department Filters */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search physician by name, specialty, or credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Departments' },
                ...depts.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDeptFilter('all');
                }}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Reset
              </button>
            )}
          </div>
        </motion.div>

        {/* Doctor Grid */}
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doc) => {
            const dep = depts.find((d) => d.id === doc.departmentId);
            return (
              <Card key={doc.id} hover className="flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={doc.name} src={doc.avatar} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-ink-900">{doc.name}</h3>
                          {doc.status === 'active' && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-brand-700">
                          {doc.specialty}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        doc.status === 'active'
                          ? 'emerald'
                          : doc.status === 'pending'
                          ? 'amber'
                          : 'slate'
                      }
                      className="capitalize text-[10px]"
                    >
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink-600">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Department:</span>
                      <strong className="text-ink-900">{dep?.name || 'General Staff'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Campus Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          doc.available ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            doc.available ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        {doc.available ? 'On Campus / On Duty' : 'Off Duty'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Current Inpatients:</span>
                      <strong className="text-ink-900">{doc.patientsToday} patients</strong>
                    </div>
                  </div>
                </div>

                {can('all') ? (
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        upsertDoctor({ ...doc, status: toggleStatus(doc.status) })
                      }
                    >
                      {doc.status === 'active' ? 'Deactivate' : 'Verify'}
                    </Button>
                    <Button
                      size="sm"
                      variant={doc.available ? 'ghost' : 'soft'}
                      onClick={() =>
                        upsertDoctor({ ...doc, available: !doc.available })
                      }
                    >
                      {doc.available ? 'Mark Off' : 'Mark On Duty'}
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
}

function toggleStatus(status: DoctorAccountStatus): DoctorAccountStatus {
  return status === 'active' ? 'inactive' : 'active';
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
  icon: typeof Stethoscope;
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
