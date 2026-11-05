import { Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { paths } from '../../routes/paths';

export function DoctorFab() {
  const { role } = useAuth();
  if (role !== 'doctor') return null;
  return (
    <Link
      to={paths.app.doctorPatients}
      className="fixed bottom-20 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-xl border border-brand-800/30 bg-brand-700 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 lg:hidden"
      aria-label="Open patient list"
    >
      <Stethoscope className="h-4 w-4" />
      <span>Patients</span>
    </Link>
  );
}
