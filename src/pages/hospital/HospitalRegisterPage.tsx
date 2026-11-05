import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  Heart,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalRegisterPage() {
  const portal = useHospitalPortal();
  const { push } = useToast();
  const navigate = useNavigate();
  const [dup, setDup] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      dob: '',
      phone: '',
      email: '',
      city: '',
      emergencyName: '',
      emergencyPhone: '',
      bloodGroup: '',
      allergies: '',
      sex: '',
      consent: false,
      healthId: '',
    },
  });

  if (!portal.can('register') && !portal.can('all')) {
    return (
      <EmptyState
        title="Restricted Intake Terminal"
        description="Patient chart registration is restricted to reception admissions officers and hospital administrators."
      />
    );
  }

  return (
    <>
      <Seo
        title="Patient Intake & Chart Registration — Hospital Command"
        description="Register a new inpatient or outpatient into the hospital master patient index (MPI)."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Admissions & Intake"
          title="Patient Intake & Chart Creation"
          description="Create a patient chart shared with authorized hospital staff. Link an existing Health ID only after the patient has approved access."
          action={
            <Button
              to={paths.app.hospitalPatients}
              variant="outline"
              size="sm"
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              Master Patient Index
            </Button>
          }
        />

        {dup ? (
          <Alert tone="warning" title="Potential Duplicate Patient Record Detected" className="mb-4">
            A patient matching this name and date of birth ({dup}) is already active in the MPI. Open their existing chart to prevent fragmenting clinical history.
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Intake Form */}
          <motion.div variants={fadeUp} className="lg:col-span-8">
            <Card>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(async (values) => {
                  if (!values.consent) return;
                  const result = await portal.registerPatient({
                    healthId: values.healthId,
                    name: values.name,
                    dob: values.dob,
                    age: Math.max(0, new Date().getFullYear() - new Date(values.dob).getFullYear()),
                    sex: values.sex,
                    phone: values.phone,
                    email: values.email,
                    city: values.city,
                    emergencyName: values.emergencyName,
                    emergencyPhone: values.emergencyPhone,
                    bloodGroup: values.bloodGroup,
                    allergies: values.allergies
                      ? values.allergies.split(',').map((s) => s.trim())
                      : [],
                  });
                  if (result.duplicate) {
                    setDup(`${result.duplicate.name} · MRN: ${result.duplicate.mrn}`);
                    return;
                  }
                  push({
                    tone: 'success',
                    title: 'Medical record created',
                    description: `Assigned MRN: ${result.created?.mrn}`,
                  });
                  if (result.created) navigate(paths.app.hospitalPatient(result.created.id));
                })}
              >
                <Input label="Existing patient Health ID (optional)" hint="The patient must first authorize this hospital account to access clinical history." {...form.register('healthId')} />
                {/* Section 1: Demographics */}
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-ink-900">Patient Demographics & Identification</h3>
                  </div>

                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    <Input
                      label="Legal Full Name *"
                      placeholder="Jane Doe"
                      {...form.register('name', { required: true })}
                    />
                    <Input
                      label="Date of Birth *"
                      type="date"
                      {...form.register('dob', { required: true })}
                    />
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-700">Administrative Sex *</label>
                      <select
                        {...form.register('sex')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-2xs focus:border-brand-600 focus:outline-none"
                      >
                        <option value="">Not recorded</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <Input
                      label="Residential City / Metro *"
                      placeholder="Seattle"
                      {...form.register('city')}
                    />
                    <Input
                      label="Primary Contact Phone *"
                      placeholder="(555) 019-2834"
                      {...form.register('phone', { required: true })}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="patient@example.com"
                      {...form.register('email')}
                    />
                  </div>
                </div>

                {/* Section 2: Clinical Safety */}
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-ink-900">Clinical Safety & Emergency Contacts</h3>
                  </div>

                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-700">ABO / Rh Blood Group</label>
                      <select
                        {...form.register('bloodGroup')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-2xs focus:border-brand-600 focus:outline-none"
                      >
                        <option value="">Unknown / not recorded</option>
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>
                    <Input
                      label="Critical Drug Allergies"
                      hint="Comma separated (e.g. Penicillin, NSAIDs, Sulfa)"
                      placeholder="Penicillin, Sulfa"
                      {...form.register('allergies')}
                    />
                    <Input
                      label="Next of Kin / Emergency Contact *"
                      placeholder="David Doe (Spouse)"
                      {...form.register('emergencyName', { required: true })}
                    />
                    <Input
                      label="Emergency Contact Telephone *"
                      placeholder="(555) 912-3049"
                      {...form.register('emergencyPhone', { required: true })}
                    />
                  </div>
                </div>

                {/* Section 3: Legal Consent */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <label className="flex items-start gap-3 text-xs text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                      {...form.register('consent', { required: true })}
                    />
                    <span>
                      <strong className="text-ink-900">Institutional Consent & Privacy Authorization:</strong> Patient (or authorized legal surrogate) formally consents to chart creation on the WellNest federated health network, authorising inpatient clinical orders and digital lifetime record issuance.
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(paths.app.hospitalPatients)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={form.formState.isSubmitting} leftIcon={<UserPlus className="h-4 w-4" />}>
                    Open Inpatient / Outpatient Chart
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Right Column: Protocols */}
          <motion.div variants={fadeUp} className="lg:col-span-4 space-y-4">
            <Card>
              <h3 className="text-sm font-bold text-ink-900">MPI Registration Standards</h3>
              <div className="mt-3 space-y-3 text-xs text-ink-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Automated Deduplication:</strong> Prevents split charts across different clinical service lines and wards.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Universal Health ID Sync:</strong> Patients receive notifications on their mobile portal once the chart opens.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Immediate Clinical Roster:</strong> Newly admitted patients immediately appear on the floor census.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200/60">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-brand-700 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-ink-900">HIPAA Security Safeguard</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    Registration timestamps and admitting clerk IDs are permanently written to the campus electronic medical records audit trail.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
