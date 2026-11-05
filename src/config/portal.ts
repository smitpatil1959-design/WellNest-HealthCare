import type { UserRole } from '../types/roles';

export const portalTheme: Record<UserRole, { label: string; eyebrow: string; description: string; image: string }> = {
  patient: { label: 'Patient', eyebrow: 'Your personal care space', description: 'Your health story, beautifully connected.', image: '/images/family-wellness.jpg' },
  doctor: { label: 'Doctor', eyebrow: 'Your clinical workspace', description: 'A clearer picture. More connected care.', image: '/images/hero-clinician.jpg' },
  hospital: { label: 'Hospital', eyebrow: 'Your hospital workspace', description: 'Every department. One connected care journey.', image: '/images/hospital-lobby.jpg' },
  laboratory: { label: 'Laboratory', eyebrow: 'Your laboratory workspace', description: 'From every test to the next step in care.', image: '/images/laboratory.jpg' },
  pharmacy: { label: 'Pharmacy', eyebrow: 'Your pharmacy workspace', description: 'Thoughtful dispensing. Connected care.', image: '/images/pharmacy.jpg' },
  insurance: { label: 'Insurance', eyebrow: 'Your insurance workspace', description: 'Clearer records. Better connected support.', image: '/images/insurance.jpg' },
  administrator: { label: 'Administration', eyebrow: 'Your platform workspace', description: 'A connected ecosystem starts with good oversight.', image: '/images/clinic-interior.jpg' },
};
