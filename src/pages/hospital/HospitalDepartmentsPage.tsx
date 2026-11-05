import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  PlusCircle,
  CheckCircle2,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalDepartmentsPage() {
  const { depts, upsertDept, can } = useHospitalPortal();
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [head, setHead] = useState('');
  const [showForm, setShowForm] = useState(false);

  const openDeptsCount = depts.filter((d) => d.open).length;
  const totalStaff = depts.reduce((acc, d) => acc + (d.staff || 0), 0);

  return (
    <>
      <Seo
        title="Clinical Service Lines & Departments — Hospital Command"
        description="Configure inpatient departments, surgical suites, and clinical service lines."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Clinical Operations"
          title="Departments & Service Lines"
          description="Manage institutional clinical service lines, inpatient ward allocations, departmental leadership, and clinical bed counts."
          action={
            can('all') ? (
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                {showForm ? 'Close Form' : 'Add Service Line'}
              </Button>
            ) : undefined
          }
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Service Lines"
            value={depts.length}
            icon={Building2}
            subtext="Clinical departments"
          />
          <StatTile
            label="Active Units"
            value={openDeptsCount}
            icon={CheckCircle2}
            subtext="Receiving patients"
          />
          <StatTile
            label="Clinical Floors"
            value={new Set(depts.map((d) => d.floor).filter(Boolean)).size || 3}
            icon={Layers}
            subtext="Facility wards"
          />
          <StatTile
            label="Departmental Staff"
            value={totalStaff}
            icon={Users}
            subtext="Assigned healthcare personnel"
          />
        </motion.div>

        {/* Create Department Form */}
        {can('all') && showForm ? (
          <motion.div variants={fadeUp}>
            <Card className="border-brand-200/80 bg-brand-50/20">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-ink-900">Establish New Service Line</h2>
                <p className="text-xs text-ink-500">
                  Define ward location, service line title, and chief of service
                </p>
              </div>
              <form
                className="mt-4 grid gap-3 sm:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!name.trim()) return;
                  const saved = await upsertDept({
                    id: `dep-${crypto.randomUUID().slice(0, 4)}`,
                    name,
                    floor,
                    head,
                    staff: 0,
                    open: true,
                  });
                  if (!saved) return;
                  setName('');
                  setFloor('');
                  setHead('');
                  setShowForm(false);
                }}
              >
                <Input
                  label="Department Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oncology & Infusion"
                />
                <Input
                  label="Hospital Floor / Wing"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 4th Floor, East Wing"
                />
                <Input
                  label="Head of Department"
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton, MD"
                />
                <div className="flex items-end">
                  <Button type="submit" fullWidth>
                    Create Department
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        ) : null}

        {/* Departments Grid */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {depts.map((d) => (
            <Card key={d.id} hover className="flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-ink-900">{d.name}</h2>
                      <p className="text-xs text-ink-500">Floor {d.floor}</p>
                    </div>
                  </div>
                  <Badge tone={d.open ? 'emerald' : 'slate'}>
                    {d.open ? 'Accepting Patients' : 'Admissions Paused'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink-600">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">Chief of Service:</span>
                    <strong className="text-ink-900">{d.head || 'Physician Director'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">Active Staff Roster:</span>
                    <span className="font-semibold text-ink-800">{d.staff} clinical personnel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-400">EMR Unit Code:</span>
                    <span className="font-mono text-ink-500">{d.id.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {can('all') ? (
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant={d.open ? 'outline' : 'soft'}
                    fullWidth
                    onClick={() => upsertDept({ ...d, open: !d.open })}
                  >
                    {d.open ? 'Pause Unit Admissions' : 'Re-Open Department'}
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
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
  icon: typeof Building2;
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
