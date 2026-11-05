import { AlertTriangle } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { EmergencyQr } from '../../components/patient/EmergencyQr';
import { useAuth } from '../../providers/AuthProvider';
import { useHealthIdentity } from '../../hooks/useHealthIdentity';

export default function EmergencyPage() {
  const { profile } = useAuth();
  const { identity } = useHealthIdentity();
  const healthId = identity?.health_id ?? '';

  return (
    <>
      <Seo title="Emergency Profile" description="Review your saved emergency profile details." />
      <PatientPageHeader
        eyebrow="Care Safety"
        title="Emergency Profile & Safety Factsheet"
        description="Emergency facts are sourced directly from your verified patient profile for emergency responders."
      />
      <Alert tone="warning" title="Identity Verification Only" className="mb-5">
        This QR identifies your universal Health ID. It does not grant unauthorized or unauthenticated parties access to your private medical records.
      </Alert>
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="text-center">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Universal Emergency QR</p>
          </div>
          {healthId ? (
            <EmergencyQr healthId={healthId} />
          ) : (
            <div className="flex h-52 items-center justify-center text-xs text-ink-400">Health ID unavailable</div>
          )}
          <p className="mt-4 text-sm font-semibold text-ink-900">
            {profile?.fullName || identity?.display_name || 'Name not recorded'}
          </p>
          {profile?.bloodGroup ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800 ring-1 ring-inset ring-rose-200">
              Blood Group: {profile.bloodGroup}
            </span>
          ) : (
            <p className="mt-1 text-xs text-ink-400">Blood group not recorded</p>
          )}
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Fact title="Allergies" items={profile?.allergies ?? []} />
          <Fact title="Medical Conditions" items={profile?.conditions ?? []} />
          <Fact title="Current Medications" items={profile?.medicationsList ?? []} />
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Emergency Contact</p>
            {profile?.emergencyContactName ? (
              <div className="mt-2.5">
                <p className="text-base font-semibold text-ink-900">{profile.emergencyContactName}</p>
                {profile.emergencyContactRelation ? (
                  <p className="text-xs text-ink-500">{profile.emergencyContactRelation}</p>
                ) : null}
                {profile.emergencyContactPhone ? (
                  <a
                    href={`tel:${profile.emergencyContactPhone.replace(/\s/g, '')}`}
                    className="mt-2.5 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    {profile.emergencyContactPhone}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-2.5 text-xs text-ink-400">No emergency contact saved. Add one in your account profile.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Fact({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</p>
      {items.length ? (
        <ul className="mt-2.5 space-y-1.5 text-xs text-ink-700">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 text-xs text-ink-400">No {title.toLowerCase()} recorded.</p>
      )}
    </Card>
  );
}
