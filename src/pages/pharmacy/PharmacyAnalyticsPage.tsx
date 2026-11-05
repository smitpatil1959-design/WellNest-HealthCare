import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Sparkline } from '../../components/ui/Sparkline';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';

export default function PharmacyAnalyticsPage() {
  const { scripts, stock } = usePharmacyPortal();

  const totalScripts = scripts.length;
  const readyOrCompleted = scripts.filter((s) => s.status === 'ready' || s.status === 'completed').length;
  const pendingVerify = scripts.filter((s) => s.status === 'verifying' || s.status === 'pending').length;
  const lowStockItems = stock.filter((i) => i.onHand <= i.reorder);
  const scriptStatusCounts = ['pending', 'verifying', 'processing', 'ready', 'completed', 'cancelled'].map(
    (status) => scripts.filter((script) => script.status === status).length,
  );
  const fillStages = [
    scripts.filter((script) => script.status === 'pending' || script.status === 'verifying').length,
    scripts.filter((script) => script.status === 'processing').length,
    scripts.filter((script) => script.status === 'ready').length,
    scripts.filter((script) => script.status === 'completed').length,
  ];

  return (
    <>
      <Seo title="Pharmacy Dispensing & Fill Analytics" description="Operational dispensing metrics, fill velocity, and formulary inventory pressure." />
      <PatientPageHeader
        eyebrow="Pharmacy Operations"
        title="Dispensing & formulary analytics"
        description="Comprehensive operational telemetry tracking script intake velocity, pharmacist DUR turnaround, dispense completion rates, and inventory reorder pressures."
      />

      {/* Primary KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-700">Prescriptions in Queue</span>
            <TrendingUp className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{totalScripts}</p>
          <p className="text-[11px] text-brand-700 font-medium">{pendingVerify} need pharmacist review</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Ready to Dispense</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{readyOrCompleted}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Ready or completed prescriptions</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Fulfillment Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">
            {totalScripts ? Math.round((readyOrCompleted / totalScripts) * 100) : 0}%
          </p>
          <p className="text-[11px] text-ink-500">{readyOrCompleted} of {totalScripts} ready</p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Inventory Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-rose-900">{lowStockItems.length}</p>
          <p className="text-[11px] text-rose-700 font-medium">Below reorder minimum</p>
        </div>
      </div>

      {/* Sparkline Visualizations */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Prescription Workflow</p>
              <h3 className="text-lg font-bold text-ink-900 mt-0.5">Queue by Current Stage</h3>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              {totalScripts} active records
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Counts are calculated from the prescription records currently available to this pharmacy.
          </p>
          <div className="mt-4 pt-2 border-t border-slate-100">
            <Sparkline className="h-16 w-full" points={scriptStatusCounts} color="#0d9488" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Dispensing Progress</p>
              <h3 className="text-lg font-bold text-ink-900 mt-0.5">Prescription Stage Counts</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              Current workflow
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Current counts at pharmacist review, processing, ready for pickup, and completed stages.
          </p>
          <div className="mt-4 pt-2 border-t border-slate-100">
            <Sparkline className="h-16 w-full" points={fillStages} color="#059669" />
          </div>
        </Card>
      </div>

      {/* Inventory Pressure & Stock Depletion Table */}
      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink-900">Formulary Stock & Reorder Pressure</h3>
            <p className="text-xs text-ink-500">Monitor on-hand quantities and reorder thresholds for this pharmacy.</p>
          </div>
          <span className="text-xs font-mono font-medium text-ink-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {stock.length} SKUs Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2.5">Medication & SKU</th>
                <th className="px-3 py-2.5">Dosage / Form</th>
                <th className="px-3 py-2.5">Lot & Expiration</th>
                <th className="px-3 py-2.5">On Hand vs Reorder</th>
                <th className="px-3 py-2.5">DEA Schedule</th>
                <th className="px-3 py-2.5 text-right">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-800">
              {stock.map((item) => {
                const isUnder = item.onHand <= item.reorder;
                const isOut = item.onHand === 0;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            isOut
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : isUnder
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-teal-100 bg-teal-50 text-brand-700'
                          }`}
                        >
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900 text-xs sm:text-sm">{item.name}</p>
                          <p className="font-mono text-[10px] text-ink-400">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      <span className="font-medium text-ink-800">{item.strength}</span>
                      <span className="block text-[11px] text-ink-400 capitalize">{item.form}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-xs font-mono text-ink-600">
                      <span>{item.lot}</span>
                      <span className="block text-[10px] text-ink-400">Exp: {item.expires}</span>
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono ${isOut ? 'text-rose-700' : isUnder ? 'text-amber-700' : 'text-ink-900'}`}>
                          {item.onHand}
                        </span>
                        <span className="text-[11px] text-ink-400">/ min {item.reorder}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      {item.controlled ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          <ShieldCheck className="h-3 w-3" /> DEA Controlled
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-400">Legend Rx</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle text-right whitespace-nowrap">
                      {isOut ? (
                        <Badge tone="rose" className="font-bold">
                          OUT OF STOCK
                        </Badge>
                      ) : isUnder ? (
                        <Badge tone="amber">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge tone="emerald">
                          Adequate
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
