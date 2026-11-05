import {
  ShieldCheck,
  AlertTriangle,
  Heart,
  Phone,
  User,
  Activity,
  FileCheck,
  Lock,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { HealthIdCard } from '../../components/health/HealthIdCard';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useHealthIdentity } from '../../hooks/useHealthIdentity';
import { useAuth } from '../../providers/AuthProvider';

export default function HealthIdPage() {
  const { profile } = useAuth();
  const { identity, loading, error, refresh } = useHealthIdentity();

  const allergies = profile?.allergies ?? [];
  const conditions = profile?.conditions ?? [];

  return (
    <>
      <Seo title="My Health ID" description="Your universal WellNest Health ID." />
      <PatientPageHeader
        eyebrow="Universal Identification"
        title="My WellNest Health ID"
        description="Your WellNest patient identifier. Participating providers use it to request access; clinical records remain subject to authentication and consent."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert tone="error" title="Could not load your ID">
          {error}
          <Button className="mt-3" size="sm" onClick={refresh}>
            Retry
          </Button>
        </Alert>
      ) : identity ? (
        <div className="space-y-6">
          {/* Main Health ID Card */}
          <HealthIdCard
            healthId={identity.health_id}
            name={profile?.fullName || identity.display_name}
            issuedDate={identity.created_at}
          />

          {/* Clinical Profile Factsheet & Emergency Info */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Critical Health Attributes */}
            <Card>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Heart className="h-4 w-4 text-rose-600" />
                <h2 className="text-sm font-semibold text-ink-900">Clinical Vitals & Identifiers</h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-ink-500 font-medium">Blood Group</span>
                  {profile?.bloodGroup ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {profile.bloodGroup}
                    </span>
                  ) : (
                    <span className="text-ink-400">Not recorded</span>
                  )}
                </div>

                <div className="py-1.5 border-b border-slate-100">
                  <p className="text-ink-500 font-medium mb-1.5">Known Allergies</p>
                  {allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {allergies.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-ink-400">No known drug/food allergies recorded</span>
                  )}
                </div>

                <div className="py-1.5">
                  <p className="text-ink-500 font-medium mb-1.5">Medical Conditions</p>
                  {conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-700 border border-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-ink-400">No active chronic conditions listed</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Emergency Contacts & Protocol */}
            <Card>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Phone className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-ink-900">Emergency Contact</h2>
              </div>

              {profile?.emergencyContactName || profile?.emergencyContactPhone ? (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-700" />
                    <span className="font-semibold text-ink-900">{profile.emergencyContactName || 'Primary Contact'}</span>
                  </div>
                  {profile?.emergencyContactPhone ? (
                    <div className="flex items-center gap-2 text-xs text-ink-600">
                      <Phone className="h-3.5 w-3.5 text-ink-400" />
                      <a href={`tel:${profile.emergencyContactPhone}`} className="hover:text-brand-700 font-medium">
                        {profile.emergencyContactPhone}
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-ink-400">
                  No emergency contact registered yet. Update your profile in Settings.
                </div>
              )}

              <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/40 p-3.5 text-xs text-teal-900">
                <div className="flex items-center gap-1.5 font-semibold text-brand-800 mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Privacy Protected</span>
                </div>
                <p className="text-[11px] leading-relaxed text-ink-500">
                  Scanning this card verifies identity only. Care providers still require your authenticated consent before accessing complete clinical history.
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
