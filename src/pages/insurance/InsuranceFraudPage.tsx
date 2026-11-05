import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  DollarSign,
  ArrowRight,
  Scale,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

export default function InsuranceFraudPage() {
  const { claims } = useInsurancePortal();
  const [searchTerm, setSearchTerm] = useState('');

  const flagged = claims.filter((c) => c.flags && c.flags.length > 0);
  const totalFlaggedAmount = flagged.reduce((acc, c) => acc + (c.amount || 0), 0);

  const filteredFlagged = claims.filter(
    (c) =>
      c.flags.length > 0 &&
      `${c.claimId} ${c.memberName} ${c.hospital} ${c.service} ${c.flags.join(' ')}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Seo
        title="Fraud, Waste & Abuse (FWA) / SIU Console — Insurance Command"
        description="Special Investigation Unit (SIU) anomaly detection, duplicate billing screening, and claims fraud prevention."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Special Investigation Unit (SIU)"
          title="Fraud, Waste & Abuse (FWA) Anomaly Console"
          description="Algorithmic outlier detection flags billing anomalies, unbundled procedure codes, duplicate submissions, and credential discrepancies for human clinical adjudication."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Flagged Claims"
            value={flagged.length}
            icon={ShieldAlert}
            subtext="Anomalies detected"
          />
          <StatTile
            label="Suspicious Value"
            value={`$${totalFlaggedAmount.toLocaleString()}`}
            icon={DollarSign}
            subtext="Under forensic hold"
          />
          <StatTile
            label="Duplicate Screening"
            value="100% Active"
            icon={Scale}
            subtext="Automated matching"
          />
          <StatTile
            label="SIU Adjudication"
            value="Mandatory Review"
            icon={AlertTriangle}
            subtext="Human sign-off required"
          />
        </motion.div>

        {/* Search Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search anomalies by claim ID, hospital, member, or flag rule..."
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
              Reset
            </button>
          )}
        </motion.div>

        {/* Flagged Claims Docket */}
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-900">
              High-Risk Anomaly Docket ({filteredFlagged.length})
            </h3>
            <span className="text-xs text-amber-800 font-semibold">
              Payout auto-suspended pending resolution
            </span>
          </div>

          {filteredFlagged.length === 0 ? (
            <EmptyState
              title={flagged.length === 0 ? 'No Anomaly Flags Detected' : 'No matching anomalies'}
              description={
                flagged.length === 0
                  ? 'All network hospital and clinic billing packets comply with active claims integrity benchmarks.'
                  : `No flagged claims matched "${searchTerm}".`
              }
            />
          ) : (
            filteredFlagged.map((c) => (
              <Card key={c.id} className="border-amber-200 bg-amber-50/20 transition-all hover:shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-ink-900">{c.claimId}</h4>
                        <Badge tone="amber" className="text-[10px]">
                          FWA Flagged
                        </Badge>
                        <span className="font-mono text-xs rounded bg-white px-2 py-0.5 border border-slate-200 font-semibold text-ink-700">
                          {c.service}
                        </span>
                        <span className="text-sm font-bold text-amber-900">
                          ${c.amount.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-ink-600">
                        Member: <strong className="text-ink-900">{c.memberName}</strong> · Billing Facility: {c.hospital} · Submitted: {c.submitted}
                      </p>

                      <div className="mt-3 rounded-xl border border-amber-200/80 bg-white p-3 space-y-1 text-xs">
                        <p className="font-bold text-amber-900">Detected Clinical Anomalies:</p>
                        <ul className="list-disc pl-5 space-y-1 text-amber-800">
                          {c.flags.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-amber-200/50 pt-3 lg:border-t-0 lg:pt-0">
                    <Button
                      to={paths.app.insuranceClaim(c.id)}
                      size="sm"
                      variant="outline"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Open Claim File
                    </Button>
                    <Button
                      to={paths.app.insuranceReview}
                      size="sm"
                    >
                      Adjudicate in Review Desk
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
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
  icon: typeof ShieldAlert;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
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
