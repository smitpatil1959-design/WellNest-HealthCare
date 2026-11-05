import { useMemo, useState } from 'react';
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { InventoryBatchForm } from '../../components/pharmacy/InventoryBatchForm';
import { Alert } from '../../components/ui/Alert';

export default function PharmacyInventoryPage() {
  const { stock, adjustStock, can, addStock, inventoryError, inventoryLoading } = usePharmacyPortal();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<'all' | string>('all');
  const [sort, setSort] = useState<'name' | 'qty'>('name');
  const [page, setPage] = useState(0);
  const [alertOnly, setAlertOnly] = useState(false);

  const rows = useMemo(() => {
    return stock
      .filter((i) => (alertOnly ? i.onHand <= i.reorder : true))
      .filter((i) => (form === 'all' ? true : i.form === form))
      .filter((i) => `${i.name} ${i.sku} ${i.lot}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a.onHand - b.onHand));
  }, [stock, query, form, sort, alertOnly]);

  const size = 8;
  const slice = rows.slice(page * size, page * size + size);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  const stats = useMemo(() => {
    const lowCount = stock.filter((i) => i.onHand <= i.reorder && i.onHand > 0).length;
    const outCount = stock.filter((i) => i.onHand <= 0).length;
    const controlledCount = stock.filter((i) => i.controlled).length;
    return {
      total: stock.length,
      low: lowCount,
      out: outCount,
      controlled: controlledCount,
    };
  }, [stock]);

  if (!can('inventory') && !can('all')) {
    return (
      <EmptyState
        icon={Package}
        title="Formulary Access Restricted"
        description="Cashiers and unverified staff cannot view or adjust the controlled medication inventory."
      />
    );
  }

  return (
    <>
      <Seo title="Medication Inventory & Formulary" description="On-hand medications, lot expiration dates, and reorder thresholds." />

      <PatientPageHeader
        title="Medication Inventory & Formulary"
        description="Track medication batches, expiry dates and stock counts shared with your pharmacy team. Changes are saved to your organization’s inventory."
      />
      {inventoryLoading && <p role="status" className="mb-4 text-sm text-ink-500">Loading saved inventory…</p>}
      {inventoryError && <Alert tone="error" title="Inventory unavailable" className="mb-4">{inventoryError.message}</Alert>}
      {can('inventory') && <InventoryBatchForm onSave={addStock} />}

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Tracked Formulary</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.total}</p>
          <p className="text-[11px] text-ink-400">Total medication SKUs</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Low Stock Reorders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-amber-700">{stats.low}</p>
          <p className="text-[11px] text-amber-600">Below minimum buffer</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">Out of Stock</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-rose-700">{stats.out}</p>
          <p className="text-[11px] text-rose-600">Immediate order needed</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">DEA Controlled (C-II)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{stats.controlled}</p>
          <p className="text-[11px] text-sky-600">Strict vault tracking</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search drug name, SKU, lot..."
            leftIcon={<Search className="h-4 w-4 text-ink-400" />}
          />
          <Select
            value={form}
            onChange={(e) => {
              setForm(e.target.value);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Dosage Forms' },
              { value: 'tablet', label: 'Oral Tablets' },
              { value: 'capsule', label: 'Capsules' },
              { value: 'inhaler', label: 'Inhalers & Sprays' },
              { value: 'liquid', label: 'Liquid Solutions' },
            ]}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            options={[
              { value: 'name', label: 'Sort: Medication Name (A-Z)' },
              { value: 'qty', label: 'Sort: Stock Level (Lowest First)' },
            ]}
          />
          <label className="flex items-center gap-2 text-xs font-medium text-ink-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={alertOnly}
              onChange={(e) => {
                setAlertOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Filter Low Stock Only</span>
          </label>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden p-0">
        {slice.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Package}
              title="No medication inventory found"
              description="No formulary medications match your search criteria or active filters."
            >
              {(query || form !== 'all' || alertOnly) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setForm('all');
                    setAlertOnly(false);
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
                  <th className="py-2.5 px-3">Medication & Strength</th>
                  <th className="py-2.5 px-3">SKU / NDC</th>
                  <th className="py-2.5 px-3">Dosage Form</th>
                  <th className="py-2.5 px-3">Lot # / Expiry</th>
                  <th className="py-2.5 px-3">Controls</th>
                  <th className="py-2.5 px-3">On Hand</th>
                  <th className="py-2.5 px-3">Stock Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((item) => {
                  const isOut = item.onHand <= 0;
                  const isLow = item.onHand <= item.reorder && !isOut;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-ink-900 text-sm">{item.name}</div>
                        <span className="text-xs text-brand-700 font-medium">{item.strength}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-ink-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-xs text-ink-600">
                        {item.form}
                      </td>
                      <td className="py-3 px-3 text-xs text-ink-600">
                        <div className="font-mono text-[11px]">Lot: {item.lot}</div>
                        <span className="text-[11px] text-ink-400">Exp: {item.expires}</span>
                      </td>
                      <td className="py-3 px-3">
                        {item.controlled ? (
                          <Badge tone="rose" className="text-[10px] font-bold">
                            Controlled C-II
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-ink-400">Rx Only</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm font-bold text-ink-900">
                        {item.onHand}
                      </td>
                      <td className="py-3 px-3">
                        {isOut ? (
                          <Badge tone="rose" className="text-[10px]">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge tone="amber" className="text-[10px]">Low (Reorder)</Badge>
                        ) : (
                          <Badge tone="emerald" className="text-[10px]">In Stock</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          leftIcon={<Plus className="h-3 w-3" />}
                          onClick={() => void adjustStock(item.id, item.onHand + 10)}
                        >
                          +10 units
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
              <span className="font-semibold text-ink-800">{rows.length}</span> items
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
