import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  ShieldCheck,
  Building2,
  FlaskConical,
  Stethoscope,
  Pill,
  User,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { VerificationPill } from '../../components/doctor/VerificationPill';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import type { ClaimDocSource } from '../../types/insurance';
import { fadeUp, stagger } from '../../animations/variants';

const map: Record<ClaimDocSource, 'hospital' | 'laboratory' | 'doctor' | 'patient'> = {
  hospital: 'hospital',
  laboratory: 'laboratory',
  pharmacy: 'hospital',
  doctor: 'doctor',
  patient: 'patient',
};

export default function InsuranceDocumentsPage() {
  const { claims } = useInsurancePortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | ClaimDocSource>('all');

  const docs = useMemo(() => {
    return claims.flatMap((c) =>
      c.documents.map((d) => ({
        ...d,
        claim: c.claimId,
        member: c.memberName,
      }))
    );
  }, [claims]);

  const verifiedCount = docs.filter((d) => d.source !== 'patient').length;
  const hospitalCount = docs.filter((d) => d.source === 'hospital').length;
  const labCount = docs.filter((d) => d.source === 'laboratory').length;

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch = `${d.title} ${d.member} ${d.claim} ${d.type}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchSource = sourceFilter === 'all' || d.source === sourceFilter;
      return matchSearch && matchSource;
    });
  }, [docs, searchTerm, sourceFilter]);

  return (
    <>
      <Seo
        title="Clinical Evidence & Claims Documentation Vault — Insurance Command"
        description="Verified medical bills, pathology findings, operative reports, and supporting claim papers."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Evidence Management"
          title="Claims Evidence & Documentation Vault"
          description="Centralized repository of hospital itemized bills, lab results, operative summaries, and discharge summaries submitted in support of claims. Patient uploads require human cross-referencing."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Evidence Records"
            value={docs.length}
            icon={FileText}
            subtext="Attached documents"
          />
          <StatTile
            label="Hospital Certified"
            value={hospitalCount}
            icon={Building2}
            subtext="Direct EMR origin"
          />
          <StatTile
            label="Lab Findings"
            value={labCount}
            icon={FlaskConical}
            subtext="Pathology certified"
          />
          <StatTile
            label="Verification Rate"
            value={`${Math.round((verifiedCount / (docs.length || 1)) * 100)}%`}
            icon={ShieldCheck}
            subtext="Tamper-proof source"
          />
        </motion.div>

        {/* Search & Source Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search evidence by document title, policyholder, claim ID, or modality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'hospital', 'laboratory', 'doctor', 'patient'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSourceFilter(s)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  sourceFilter === s
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'All Sources' : s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Evidence Documents List */}
        <motion.div variants={fadeUp} className="space-y-3">
          {filteredDocs.map((d) => (
            <Card key={d.id} hover className="transition-all">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-ink-700">
                    {d.source === 'laboratory' ? (
                      <FlaskConical className="h-5 w-5" />
                    ) : d.source === 'doctor' ? (
                      <Stethoscope className="h-5 w-5" />
                    ) : d.source === 'patient' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-ink-900">{d.title}</h4>
                      <Badge tone="slate" className="text-[10px]">
                        {d.type}
                      </Badge>
                      <VerificationPill source={map[d.source]} />
                    </div>
                    <p className="text-xs text-ink-600">
                      Member: <strong className="text-ink-900">{d.member}</strong> · Associated Claim:{' '}
                      <span className="font-mono text-brand-700 font-semibold">{d.claim}</span>
                    </p>
                    <p className="text-[11px] text-ink-400">Date of Record: {d.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.print()}
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Download Packet
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
  icon: typeof FileText;
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
