import { Badge } from '../ui/Badge';
import type { VerificationSource } from '../../types/doctor';

const map: Record<VerificationSource, { label: string; tone: 'emerald' | 'brand' | 'sky' | 'slate' | 'amber' }> = {
  doctor: { label: 'Verified by Doctor', tone: 'brand' },
  hospital: { label: 'Verified by Hospital', tone: 'emerald' },
  laboratory: { label: 'Verified by Laboratory', tone: 'sky' },
  patient: { label: 'Patient uploaded', tone: 'slate' },
  unverified: { label: 'Requires verification', tone: 'amber' },
};

export function VerificationPill({ source }: { source: VerificationSource }) {
  const item = map[source];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
