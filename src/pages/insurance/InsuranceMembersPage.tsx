import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

export default function InsuranceMembersPage() {
  const { policies, claims, can } = useInsurancePortal();
  const [searchTerm, setSearchTerm] = useState('');

  const activeCount = policies.filter((p) => p.status === 'active').length;
  const pendingCount = policies.filter((p) => p.status === 'pending').length;

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) =>
      `${p.memberName} ${p.policyId} ${p.plan}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [policies, searchTerm]);

  if (!can('members') && !can('all') && !can('policies')) {
    return (
      <EmptyState
        title="Member Directory Restricted"
        description="Access to policyholder records is limited to authorized Member Services and Underwriting staff."
      />
    );
  }

  return (
    <>
      <Seo
        title="Enrolled Policyholders & Members — Insurance Command"
        description="Insured lives directory, active coverage verification, and policyholder claim records."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Member Services"
          title="Enrolled Policyholders & Covered Lives"
          description="View active plan policyholders, benefit tier eligibility, family member riders, and real-time claim histories. Zero private clinical records are exposed beyond consented documentation."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Enrolled Lives"
            value={policies.length}
            icon={Users}
            subtext="Active policy records"
          />
          <StatTile
            label="In-Force Coverage"
            value={activeCount}
            icon={CheckCircle2}
            subtext="Active premium payers"
          />
          <StatTile
            label="Pending Underwriting"
            value={pendingCount}
            icon={Clock}
            subtext="Verification required"
          />
          <StatTile
            label="Identity-linked policies"
            value={policies.filter((policy) => Boolean(policy.patientId && policy.policyId)).length}
            icon={ShieldCheck}
            subtext="Policy and member IDs available"
          />
        </motion.div>

        {/* Search Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search member by full name, policy identifier, or plan tier..."
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

        {/* Members Grid */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPolicies.map((p) => {
            const isActive = p.status === 'active';
            return (
              <Card key={p.id} hover className="flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.memberName} src={p.avatar} size="md" />
                      <div>
                        <h3 className="text-base font-bold text-ink-900">{p.memberName}</h3>
                        <p className="font-mono text-xs font-semibold text-brand-700">
                          {p.policyId}
                        </p>
                      </div>
                    </div>
                    <Badge tone={isActive ? 'emerald' : 'amber'} className="capitalize text-[10px]">
                      {p.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-ink-600">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Plan Tier:</span>
                        <strong className="text-ink-900">{p.plan}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Coverage Window:</span>
                        <span className="text-ink-700">{p.effective || 'Not specified'} → {p.expires || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">Claim Amount:</span>
                      <span className="font-semibold text-brand-800">
                          ${claims.filter((claim) => claim.policyId === p.id).reduce((total, claim) => total + claim.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <Button
                    to={paths.app.insuranceMember(p.id)}
                    size="sm"
                    variant="outline"
                    fullWidth
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Open Insurance Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </motion.div>
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
  icon: typeof Users;
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
