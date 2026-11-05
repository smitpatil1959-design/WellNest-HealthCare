import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Stethoscope,
  Building2,
  Calendar,
  Award,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

interface Doctor {
  id: string;
  full_name: string;
  professional_title: string | null;
  specialty: string | null;
  organization: string | null;
}

const emptyDoctors: Doctor[] = [];

export default function DoctorsPage() {
  const query = useAuthenticatedApi<Doctor[]>('/api/doctors');
  const doctors = query.data ?? emptyDoctors;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        `${doc.full_name} ${doc.specialty || ''} ${doc.organization || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchSpecialty =
        selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  return (
    <>
      <Seo
        title="Find Doctors — WellNest"
        description="Directory of verified physicians, specialists, and care teams across the network."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Care Network"
          title="Physician & Specialist Directory"
          description="Browse the doctor profiles currently listed in the WellNest directory and filter by the specialties and affiliations provided."
          action={
            <Button to={paths.app.patientAppointments} size="sm" leftIcon={<Calendar className="h-4 w-4" />}>
              Schedule Appointment
            </Button>
          }
        />

        {/* Stats Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Listed doctors"
            value={doctors.length}
            icon={Stethoscope}
            subtext="Profiles in the directory"
          />
          <StatTile
            label="Specialties"
            value={specialties.length}
            icon={Award}
            subtext="Listed clinical disciplines"
          />
          <StatTile
            label="Network facilities"
            value={new Set(doctors.map((d) => d.organization).filter(Boolean)).size}
            icon={Building2}
            subtext="Affiliations listed on profiles"
          />
          <StatTile
            label="Profiles with facility"
            value={doctors.filter((doctor) => Boolean(doctor.organization)).length}
            icon={Building2}
            subtext="Affiliation provided"
          />
        </motion.div>

        {/* Search & Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search by physician name, specialty, or hospital facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-ink-400" />}
              />
            </div>
            {specialties.length > 0 && (
              <Select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                options={[
                  { value: 'all', label: 'All Specialties' },
                  ...specialties.map((s) => ({ value: s, label: s })),
                ]}
              />
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('all');
              }}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Reset filters
            </button>
          )}
        </motion.div>

        {/* Doctor Directory Grid */}
        <AuthenticatedApiState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {filteredDoctors.length === 0 ? (
            <EmptyState
              title={doctors.length === 0 ? 'No doctor profiles found' : 'No matching physicians'}
              description={
                doctors.length === 0
                  ? 'Doctor profiles will appear here when they are listed in the directory.'
                  : `No doctors matched "${searchTerm}". Try broadening your specialty or hospital query.`
              }
            />
          ) : (
            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor) => {
                const displayName = `${doctor.professional_title ? `${doctor.professional_title} ` : 'Dr. '}${doctor.full_name}`;
                return (
                  <Card key={doctor.id} hover className="flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={doctor.full_name} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-base font-bold text-ink-900">{displayName}</h2>
                            </div>
                            <p className="text-xs font-medium text-brand-700">
                              {doctor.specialty || 'Specialty not listed'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-ink-400" />
                          <span className="truncate font-medium">
                            {doctor.organization || 'Affiliation not listed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3.5">
                      <Button
                        to={paths.app.patientAppointments}
                        size="sm"
                        leftIcon={<Calendar className="h-3.5 w-3.5" />}
                      >
                        Book Visit
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AuthenticatedApiState>
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
