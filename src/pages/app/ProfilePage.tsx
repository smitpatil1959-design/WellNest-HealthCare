import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { profileSchema, type ProfileValues } from '../../services/auth/schemas';
import { AUTH_ROLE_LABELS } from '../../types/auth';
import { useAuthForm } from '../../hooks/useAuthForm';
import { safeApiFetch } from '../../utils/apiFetch';

export default function ProfilePage() {
  const { profile, user, session, refreshProfile } = useAuth();
  const { push } = useToast();
  const { serverError, busy, run } = useAuthForm();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName ?? '',
      organization: profile?.organization ?? '',
      phone: profile?.phone ?? '',
      language: profile?.language ?? 'en',
      dateOfBirth: profile?.dateOfBirth ?? '',
      gender: profile?.gender ?? '',
      address: profile?.address ?? '',
      bloodGroup: profile?.bloodGroup ?? '',
      allergies: profile?.allergies?.join(', ') ?? '',
      conditions: profile?.conditions?.join(', ') ?? '',
      medications: profile?.medicationsList?.join(', ') ?? '',
      emergencyContactName: profile?.emergencyContactName ?? '',
      emergencyContactRelation: profile?.emergencyContactRelation ?? '',
      emergencyContactPhone: profile?.emergencyContactPhone ?? '',
      professionalTitle: profile?.professionalTitle ?? '',
      licenseNumber: profile?.licenseNumber ?? '',
      specialty: profile?.specialty ?? '',
    },
  });

  if (!profile || !user) return null;

  const onSubmit = (values: ProfileValues) =>
    run(async () => {
      if (!session?.access_token) throw new Error('Your session expired. Please sign in again.');
      const patientFields = [values.dateOfBirth, values.gender, values.address, values.bloodGroup, values.phone, values.emergencyContactName, values.emergencyContactRelation, values.emergencyContactPhone];
      const doctorFields = [values.fullName, values.phone, values.organization, values.professionalTitle, values.licenseNumber, values.specialty];
      const licensedOrgFields = [values.organization, values.licenseNumber];
      const requiredFields = profile.role === 'patient' ? patientFields : profile.role === 'doctor' ? [] : ['laboratory', 'pharmacy'].includes(profile.role) ? licensedOrgFields : [values.organization];
      if (requiredFields.some((field) => !field?.trim())) {
        throw new Error(profile.role === 'patient'
          ? 'Complete date of birth, gender, address, blood group, phone, and emergency contact before saving.'
          : profile.role === 'doctor'
            ? 'Complete organization, professional title, license number, and specialty before saving.'
            : ['laboratory', 'pharmacy'].includes(profile.role)
              ? 'Complete organization and license number before saving.'
              : 'Complete your organization before saving.');
      }
      const splitList = (value?: string) => value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
      const profileUpdate = {
        ...(profile.role === 'doctor' ? {} : {
          full_name: values.fullName,
          organization: values.organization ?? '',
          professional_title: values.professionalTitle || '',
          license_number: values.licenseNumber || '',
          specialty: values.specialty || '',
        }),
        phone: values.phone ?? '',
        language: values.language,
        date_of_birth: values.dateOfBirth || null,
        gender: values.gender || '',
        address: values.address || '',
        blood_group: values.bloodGroup || '',
        allergies: splitList(values.allergies),
        conditions: splitList(values.conditions),
        medications_list: splitList(values.medications),
        emergency_contact_name: values.emergencyContactName || '',
        emergency_contact_relation: values.emergencyContactRelation || '',
        emergency_contact_phone: values.emergencyContactPhone || '',
        onboarding_completed: profile.role === 'doctor'
          ? profile.onboardingCompleted || doctorFields.every((field) => Boolean(field?.trim()))
          : true,
      };
      const result = await safeApiFetch<{ success: boolean }>('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdate),
      });
      if (!result.ok) throw new Error(result.error);
      await refreshProfile();
      push({ tone: 'success', title: 'Profile saved', description: 'Your account details were successfully updated.' });
    });

  return (
    <>
      <Seo title="Profile" description="Manage your WellNest profile." />
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">Account Profile</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Profile Details</h1>
        <p className="mt-1 text-sm text-ink-500">Identity details associated with your authenticated session.</p>
      </div>

      {serverError ? (
        <Alert tone="error" title="Could not save profile" className="mb-6">
          {serverError}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="text-center">
          <Avatar name={profile.fullName} src={profile.avatarUrl || undefined} size="xl" className="mx-auto shadow-sm" />
          <h2 className="mt-4 font-semibold text-ink-900 text-base">{profile.fullName}</h2>
          <p className="text-xs text-ink-500">{profile.email}</p>
          <div className="mt-3">
            <Badge tone="brand">{AUTH_ROLE_LABELS[profile.role]}</Badge>
          </div>
          <p className="mt-4 text-[11px] text-ink-400 border-t border-slate-100 pt-3">
            Account verified across the WellNest platform.
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-ink-900">
                {profile.role === 'patient' ? 'Patient Personal Information' : 'Professional Credential Information'}
              </h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Details are securely stored on your account profile.
              </p>
            </div>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <Input
                label="Full name"
                readOnly={profile.role === 'doctor'}
                hint={profile.role === 'doctor' ? 'Verified clinician name changes require administration approval.' : undefined}
                error={form.formState.errors.fullName?.message}
                {...form.register('fullName')}
              />
              <Input label="Email address" value={profile.email} disabled hint="Email modification requires administrator support." />
              <Input label="Phone number" placeholder="e.g. +1 (555) 012-3456" error={form.formState.errors.phone?.message} {...form.register('phone')} />
              {profile.role === 'patient' ? (
                <>
                  <Input label="Date of birth" type="date" {...form.register('dateOfBirth')} />
                  <Select
                    label="Gender"
                    options={[
                      { value: '', label: 'Select gender' },
                      { value: 'female', label: 'Female' },
                      { value: 'male', label: 'Male' },
                      { value: 'non-binary', label: 'Non-binary' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                    ]}
                    {...form.register('gender')}
                  />
                  <Input label="Blood group" placeholder="e.g. O+, A-, B+" {...form.register('bloodGroup')} />
                  <Input label="Residential address" placeholder="Street, city, postal code" {...form.register('address')} />
                  <Input label="Known allergies (comma separated)" placeholder="e.g. Penicillin, Peanuts" {...form.register('allergies')} />
                  <Input label="Medical conditions (comma separated)" placeholder="e.g. Hypertension, Asthma" {...form.register('conditions')} />
                  <Input label="Current medications (comma separated)" placeholder="e.g. Lisinopril 10mg" {...form.register('medications')} />
                  <Input label="Emergency contact name" placeholder="Full name of contact" {...form.register('emergencyContactName')} />
                  <Input label="Emergency contact relationship" placeholder="e.g. Spouse, Parent" {...form.register('emergencyContactRelation')} />
                  <Input label="Emergency contact phone" placeholder="Phone number" {...form.register('emergencyContactPhone')} />
                </>
              ) : (
                <>
                  <Input
                    label="Organization"
                    readOnly={profile.role === 'doctor'}
                    hint={profile.role === 'doctor' ? 'Clinical affiliation managed by hospital administration.' : undefined}
                    error={form.formState.errors.organization?.message}
                    {...form.register('organization')}
                  />
                  {profile.role === 'doctor' ? (
                    <>
                      <Input label="Professional title" readOnly hint="Verified credential." {...form.register('professionalTitle')} />
                      <Input label="License number" readOnly hint="Verified credential." {...form.register('licenseNumber')} />
                      <Input label="Specialty" readOnly hint="Verified clinical specialty." {...form.register('specialty')} />
                    </>
                  ) : null}
                  {['laboratory', 'pharmacy'].includes(profile.role) ? (
                    <Input label="Facility license number" {...form.register('licenseNumber')} />
                  ) : null}
                </>
              )}
              <Select
                label="Preferred language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
                {...form.register('language')}
              />
              <div className="pt-2 sm:col-span-2 border-t border-slate-100 flex justify-end">
                <Button type="submit" loading={busy}>
                  Save profile changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
