import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Search,
  Calendar,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

interface Hospital {
  id: string;
  full_name: string;
  organization: string | null;
  address: string | null;
  phone: string | null;
}

const emptyHospitals: Hospital[] = [];

export default function HospitalsPage() {
  const query = useAuthenticatedApi<Hospital[]>('/api/hospitals');
  const hospitals = query.data ?? emptyHospitals;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const queryStr = `${h.organization || ''} ${h.full_name || ''} ${h.address || ''}`.toLowerCase();
      return queryStr.includes(searchTerm.toLowerCase());
    });
  }, [hospitals, searchTerm]);

  return (
    <>
      <Seo
        title="Network Hospitals — WellNest"
        description="Search healthcare facilities listed in the WellNest directory."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Care Infrastructure"
          title="Healthcare facility directory"
          description="Search healthcare facilities listed in the WellNest directory and review the contact details available for each organization."
          action={
            <Button
              to={paths.app.patientAppointments}
              size="sm"
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              Book Visit
            </Button>
          }
        />

        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile
            label="Directory facilities"
            value={hospitals.length}
            icon={Building2}
            subtext="Organizations listed in the directory"
          />
        </motion.div>

        {/* Search Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search by facility name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Reset search
            </button>
          )}
        </motion.div>

        {/* Hospital Cards Grid */}
        <AuthenticatedApiState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {filteredHospitals.length === 0 ? (
            <EmptyState
              title={hospitals.length === 0 ? 'No facilities found' : 'No matching facilities'}
              description={
                hospitals.length === 0
                  ? 'Healthcare facilities will appear here when they are listed in the directory.'
                  : `No facility matched "${searchTerm}". Please broaden your search criteria.`
              }
            />
          ) : (
            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHospitals.map((hospital) => {
                const facilityName = hospital.organization || hospital.full_name;
                return (
                  <Card key={hospital.id} hover className="flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-base font-bold text-ink-900">{facilityName}</h2>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400 mt-0.5" />
                          <span className="font-medium text-ink-700">
                            {hospital.address || 'Address not provided'}
                          </span>
                        </div>
                        {hospital.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                            <a
                              href={`tel:${hospital.phone}`}
                              className="font-medium text-brand-700 hover:underline"
                            >
                              {hospital.phone}
                            </a>
                          </div>
                        ) : null}
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
