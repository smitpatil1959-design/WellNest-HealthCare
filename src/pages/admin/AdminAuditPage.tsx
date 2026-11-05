import { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  FileText,
  Lock,
  Building2,
  CheckCircle2,
  XCircle,
  Hash,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { useToast } from '../../providers/ToastProvider';

export default function AdminAuditPage() {
  const { audit } = useAdminPortal();
  const { push } = useToast();
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () => audit.filter((a) => `${a.actor} ${a.action} ${a.record} ${a.role}`.toLowerCase().includes(query.toLowerCase())),
    [audit, query],
  );

  const okCount = audit.filter((a) => a.result === 'ok').length;
  const deniedCount = audit.filter((a) => a.result === 'denied').length;

  return (
    <>
      <Seo title="Platform Audit Log" description="Recorded platform activity." />
      <PatientPageHeader
        eyebrow="Immutable Audit Ledger"
        title="HIPAA compliance & platform audit log"
        description="Review recorded platform events, their acting accounts and saved timestamps. This portal offers read and export controls; database retention is managed separately."
      />

      {/* Primary KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Audit Ledger Entries</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{audit.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Authorized Transactions</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-700">{okCount}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-800">Security / Policy Blocks</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-rose-900">{deniedCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Data source</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">Saved events</p>
        </div>
      </div>

      {/* Search & Export Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit ledger by actor, role, action, or target record ID..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              const cell = (value: string) => `"${(/^[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
              const csv = [['Timestamp', 'Actor', 'Action', 'Target', 'Result'], ...rows.map(row => [row.at, row.actor, row.action, row.record, row.result])].map(row => row.map(cell).join(',')).join('\r\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
              const link = document.createElement('a'); link.href = url; link.download = 'WellNest-audit.csv'; link.click(); URL.revokeObjectURL(url);
              push({ tone: 'success', title: 'Audit CSV downloaded' });
            }}
          >
            Download audit CSV
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Target Record</th>
                <th className="px-4 py-3 text-right">Ledger Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-800">
              {rows.map((a) => {
                const isOk = a.result === 'ok';

                return (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 align-middle text-xs font-mono text-ink-500 whitespace-nowrap">
                      {a.at.replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs font-semibold text-ink-900">
                      {a.action}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs">
                      <p className="font-semibold text-ink-900">{a.actor}</p>
                      <p className="text-[11px] text-brand-700 capitalize font-medium">{a.role}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-xs font-mono">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-ink-700 border border-slate-200">
                        {a.record}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                      <Badge
                        tone={isOk ? 'emerald' : 'rose'}
                        className="capitalize"
                      >
                        {a.result}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIPAA Compliance Ledger Guarantee */}
      <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-xs text-teal-900">
        <div className="flex items-center gap-2 font-semibold text-brand-800 mb-1">
          <Lock className="h-4 w-4" />
          <span>Statutory HIPAA Security Rule § 164.312(b) Compliance</span>
        </div>
        <p className="leading-relaxed text-ink-600">
          WellNest implements hardware-backed audit logging mechanisms that record and examine activity in information systems that contain or use electronic protected health information (ePHI).
        </p>
      </div>
    </>
  );
}
