import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { ClaimStatus } from '../../types/insurance';

export default function InsuranceClaimsPage() {
  const { claims } = useInsurancePortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ClaimStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    return claims.filter((c) => {
      const hay = `${c.claimId} ${c.memberName} ${c.hospital} ${c.service}`.toLowerCase();
      return hay.includes(query.toLowerCase()) && (status === 'all' || c.status === status);
    });
  }, [claims, query, status]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    return {
      total: claims.length,
      new: claims.filter((c) => c.status === 'new').length,
      review: claims.filter((c) => c.status === 'review' || c.status === 'documents').length,
      paid: claims.filter((c) => c.status === 'approved' || c.status === 'paid').length,
    };
  }, [claims]);

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'paid':
      case 'approved':
        return 'emerald';
      case 'review':
      case 'documents':
        return 'sky';
      case 'new':
        return 'amber';
      case 'rejected':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo title="Insurance Claims Register" description="Electronic health insurance claims adjudication and settlement register." />

      <PatientPageHeader
        title="Insurance Claims Register"
        description="Review clinical documentation, adjudicate healthcare claims, and verify medical necessity against plan coverage."
        action={
          <Button to={paths.app.insuranceReview} size="sm" leftIcon={<Clock className="h-4 w-4" />}>
            Open Review Queue
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Total Book of Claims</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">All submitted claims</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">New Intake</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.new}</p>
          <p className="text-[11px] text-amber-600">Pending initial triage</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">In Clinical Review</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.review}</p>
          <p className="text-[11px] text-sky-600">Documentation & policy review</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Approved & Settled</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{stats.paid}</p>
          <p className="text-[11px] text-emerald-600">Cleared for remittance</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search claim ID, member name, facility, or service..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Claim Statuses' },
              { value: 'new', label: 'New Submissions' },
              { value: 'documents', label: 'Pending Documentation' },
              { value: 'review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'paid', label: 'Paid & Remitted' },
              { value: 'rejected', label: 'Rejected / Denied' },
            ]}
          />
        </div>
      </Card>

      {/* Claims Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No insurance claims found"
              description="No healthcare claims match your search query or active status filter."
            >
              {(query || status !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="py-2.5 px-3">Claim ID</th>
                  <th className="py-2.5 px-3">Insured Member</th>
                  <th className="py-2.5 px-3">Service / Procedure</th>
                  <th className="py-2.5 px-3">Healthcare Provider</th>
                  <th className="py-2.5 px-3">Submitted Date</th>
                  <th className="py-2.5 px-3">Claimed Amount</th>
                  <th className="py-2.5 px-3">Adjudication Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {c.claimId}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink-900 text-sm">{c.memberName}</div>
                      <span className="font-mono text-[10px] text-ink-400">Plan: {c.policyId || 'Active Policy'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-medium text-ink-800">{c.service}</div>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-600">
                      <div>{c.hospital || 'Hospital Provider'}</div>
                      <span className="text-[11px] text-ink-400">Dr. {c.doctor || 'Attending'}</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(c.submitted)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs font-bold text-ink-900">
                      ${c.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getStatusTone(c.status)} className="capitalize text-[10px]">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        to={paths.app.insuranceClaim(c.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-brand-700 hover:text-brand-900 hover:bg-brand-50"
                        rightIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-ink-500">
              Showing <span className="font-semibold text-ink-800">{page * size + 1}</span> to{' '}
              <span className="font-semibold text-ink-800">{Math.min((page + 1) * size, rows.length)}</span> of{' '}
              <span className="font-semibold text-ink-800">{rows.length}</span> claims
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 text-ink-600 font-medium">
                {page + 1} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page + 1 >= pages}
                onClick={() => setPage((n) => n + 1)}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
