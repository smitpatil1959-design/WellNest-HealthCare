import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  Download,
  DollarSign,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

interface InsuranceResponse {
  success: boolean;
  plan: {
    plan_name: string;
    policy_number: string;
    coverage_type: string;
    coverage_limit: number | null;
    deductible: number | null;
    valid_from: string | null;
    valid_to: string | null;
    status: string;
  } | null;
}

export default function InsurancePage() {
  const { profile } = useAuth();
  const query = useAuthenticatedApi<InsuranceResponse>('/api/insurance');
  const plan = query.data?.plan;
  const [copied, setCopied] = useState(false);
  const isPlanActive = plan?.status.toLowerCase() === 'active';

  const copyPolicy = () => {
    if (!plan?.policy_number) return;
    navigator.clipboard.writeText(plan.policy_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Seo
        title="Health Insurance & Coverage — WellNest"
        description="Review the insurance plan details currently linked to your patient account."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Coverage & plan details"
          title="Health Insurance & Benefits"
          description="Review the plan name, policy number, coverage limits, deductible, and dates supplied for your linked insurance plan."
          action={
            <Button
              to={paths.app.patientHospitals}
              size="sm"
              variant="outline"
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              Network Facilities
            </Button>
          }
        />

        <AuthenticatedApiState
          loading={query.isLoading}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {!plan ? (
            <EmptyState
              title="No insurance plan linked"
              description="Your healthcare insurance policy will appear here once your employer or health plan administrator connects your WellNest account."
            >
              <Button to={paths.contact} variant="outline" size="sm" className="mt-4">
                Inquire with Support
              </Button>
            </EmptyState>
          ) : (
            <>
              {/* Digital Insurance Card Banner */}
              <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-teal-800/40 bg-gradient-to-br from-brand-900 via-brand-950 to-ink-950 p-6 text-white shadow-lg sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-6 sm:min-h-[220px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300">
                          Health Benefit Card
                        </span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {plan.plan_name}
                      </h2>
                      <p className="text-xs text-teal-200/80">Coverage type: {plan.coverage_type || 'Not provided'}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize backdrop-blur-md ${
                        isPlanActive
                          ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-400/30 bg-slate-500/20 text-slate-200'
                      }`}
                    >
                      {plan.status || 'Status not provided'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-teal-800/50 pt-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        Insured Member
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        {profile?.fullName || 'Account Member'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        Policy Number
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold text-white tracking-wider">
                          {plan.policy_number}
                        </span>
                        <button
                          type="button"
                          onClick={copyPolicy}
                          className="rounded p-0.5 text-teal-300 hover:text-white"
                          title="Copy policy number"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        Coverage Limit
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        {plan.coverage_limit == null ? 'Not provided' : `$${plan.coverage_limit.toLocaleString()}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        Valid Thru
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        {plan.valid_to ? formatDate(plan.valid_to) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Financial Metrics Row */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Coverage Limit"
                  value={plan.coverage_limit == null ? 'Not provided' : `$${plan.coverage_limit.toLocaleString()}`}
                  subtext="As listed on your plan"
                  icon={DollarSign}
                />
                <StatTile
                  label="Deductible"
                  value={plan.deductible == null ? 'Not provided' : `$${plan.deductible.toLocaleString()}`}
                  subtext="As listed on your plan"
                  icon={CreditCard}
                />
                <StatTile
                  label="Plan status"
                  value={plan.status || 'Not provided'}
                  subtext="Status supplied by the plan"
                  icon={ShieldCheck}
                />
                <StatTile
                  label="Coverage starts"
                  value={plan.valid_from ? formatDate(plan.valid_from) : 'Not provided'}
                  subtext="Effective date"
                  icon={Calendar}
                />
              </motion.div>

              {/* Coverage Details Grid */}
              <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-ink-900">Plan details</h2>
                      <p className="text-xs text-ink-500">Coverage information supplied with this plan</p>
                    </div>
                    <Badge tone="slate" className="capitalize">{plan.coverage_type || 'Coverage type not provided'}</Badge>
                  </div>

                  <div className="space-y-3">
                    <BenefitRow
                      title="Coverage limit"
                      description="Maximum coverage amount shown for this plan"
                      coverage={plan.coverage_limit == null ? 'Not provided' : `$${plan.coverage_limit.toLocaleString()}`}
                    />
                    <BenefitRow
                      title="Deductible"
                      description="Deductible amount shown for this plan"
                      coverage={plan.deductible == null ? 'Not provided' : `$${plan.deductible.toLocaleString()}`}
                    />
                    <BenefitRow
                      title="Coverage period"
                      description="Effective and end dates shown for this plan"
                      coverage={`${plan.valid_from ? formatDate(plan.valid_from) : 'Start not provided'} – ${plan.valid_to ? formatDate(plan.valid_to) : 'End not provided'}`}
                    />
                  </div>
                </Card>

                {/* Side Card: Policy Administration */}
                <div className="space-y-4">
                  <Card>
                    <h3 className="text-sm font-bold text-ink-900">Policy information</h3>
                    <div className="mt-3 space-y-2.5 text-xs text-ink-600">
                      <p>
                        <strong className="text-ink-900">Plan:</strong> {plan.plan_name}
                      </p>
                      <p>
                        <strong className="text-ink-900">Coverage type:</strong> {plan.coverage_type || 'Not provided'}
                      </p>
                      <p>
                        <strong className="text-ink-900">Coverage Dates:</strong>{' '}
                        {plan.valid_from ? formatDate(plan.valid_from) : 'Not provided'} –{' '}
                        {plan.valid_to ? formatDate(plan.valid_to) : 'Not provided'}
                      </p>
                    </div>

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        onClick={() => window.print()}
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                      >
                        Print Digital ID Card
                      </Button>
                      <Button
                        to={paths.app.patientHospitals}
                        size="sm"
                        fullWidth
                      >
                        Find In-Network Provider
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-slate-50/70 border-slate-200/60">
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="h-4 w-4 shrink-0 text-brand-700 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-ink-900">Questions about your coverage?</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                          Contact your insurer or plan administrator to confirm benefits, eligibility, and any authorization requirements.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            </>
          )}
        </AuthenticatedApiState>
      </motion.div>
    </>
  );
}

function BenefitRow({
  title,
  description,
  coverage,
}: {
  title: string;
  description: string;
  coverage: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold text-ink-900">{title}</p>
        <p className="text-[11px] text-ink-500">{description}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-brand-800 shadow-2xs border border-slate-200/80">
        {coverage}
      </span>
    </div>
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
  icon: typeof DollarSign;
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
