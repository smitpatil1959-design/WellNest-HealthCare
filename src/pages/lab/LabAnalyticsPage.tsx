import { AlertTriangle, CheckCircle2, Clock3, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Sparkline } from '../../components/ui/Sparkline';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { seriesByDate } from '../../utils/analytics';

export default function LabAnalyticsPage() {
  const { orders, reports } = useLabPortal();
  const activeOrders = orders.filter((order) => order.status === 'requested' || order.status === 'pending' || order.status === 'in-progress');
  const awaitingVerification = reports.filter((report) => report.status === 'awaiting-verify');
  const publishedReports = reports.filter((report) => report.status === 'published');
  const unresolvedCritical = reports.filter((report) => report.critical && report.status !== 'published');
  const completedOrders = orders
    .filter((order) => order.resulted && order.requested)
    .map((order) => ({
      order,
      hours: (Date.parse(order.resulted!) - Date.parse(order.requested)) / 3_600_000,
    }))
    .filter(({ hours }) => Number.isFinite(hours) && hours >= 0);
  const averageTurnaroundHours = completedOrders.length
    ? completedOrders.reduce((sum, item) => sum + item.hours, 0) / completedOrders.length
    : null;
  const requestTrend = seriesByDate(orders.map((order) => order.requested));
  const releaseTrend = seriesByDate(reports.map((report) => report.publishedAt));
  const turnaroundTrend = completedOrders
    .slice()
    .sort((left, right) => left.order.requested.localeCompare(right.order.requested))
    .slice(-9)
    .map((item) => item.hours);
  const byKind = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.kind] = (acc[order.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Seo title="Laboratory analytics" description="Current laboratory orders, report status, and turnaround measurements." />
      <PatientPageHeader
        eyebrow="Laboratory operations"
        title="Orders & turnaround analytics"
        description="Track accessioned orders, reports awaiting sign-off, critical findings, and turnaround times calculated from your laboratory records."
      />

      <section aria-label="Laboratory metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Orders in workflow" value={activeOrders.length} detail="Requested, pending, or in progress" icon={FlaskConical} />
        <MetricCard label="Awaiting verification" value={awaitingVerification.length} detail="Reports requiring pathologist sign-off" icon={Clock3} tone="amber" />
        <MetricCard label="Published reports" value={publishedReports.length} detail="Released from this workspace" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Unresolved critical" value={unresolvedCritical.length} detail="Critical reports not yet published" icon={AlertTriangle} tone="amber" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <TrendCard title="Orders by requested date" value={orders.length} points={requestTrend} detail="Daily order counts from the available order records." />
        <TrendCard title="Reports published" value={publishedReports.length} points={releaseTrend} detail="Published report counts grouped by release date." color="#059669" />
        <TrendCard
          title="Average turnaround"
          value={averageTurnaroundHours === null ? '—' : `${averageTurnaroundHours.toFixed(1)} h`}
          points={turnaroundTrend}
          detail={`${completedOrders.length} orders with both request and result timestamps.`}
          color="#0284c7"
        />
      </section>

      <Card className="mt-5">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Order mix by test type</h2>
            <p className="mt-1 text-sm text-ink-500">Based on orders currently available to this laboratory.</p>
          </div>
          <Link to={paths.app.labTests} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Open test queue</Link>
        </div>
        {Object.keys(byKind).length === 0 ? (
          <p className="pt-4 text-sm text-ink-500">Order analytics will appear when laboratory orders are available.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(byKind).map(([kind, count]) => (
              <div key={kind} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <p className="text-xs font-medium capitalize text-ink-500">{kind}</p>
                <p className="mt-2 font-display text-2xl text-ink-900">{count}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof FlaskConical;
  tone?: 'brand' | 'amber' | 'emerald';
}) {
  const tones = { brand: 'bg-brand-50 text-brand-700', amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700' };
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{detail}</p>
    </Card>
  );
}

function TrendCard({
  title,
  value,
  points,
  detail,
  color,
}: {
  title: string;
  value: number | string;
  points: number[];
  detail: string;
  color?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      <p className="mt-2 font-display text-3xl text-ink-900">{value}</p>
      {points.length ? <Sparkline className="mt-3 h-12 w-full" points={points} color={color} /> : <div className="mt-3 h-12 rounded-lg bg-slate-50" aria-hidden />}
      <p className="mt-2 text-xs leading-relaxed text-ink-500">{detail}</p>
    </Card>
  );
}
