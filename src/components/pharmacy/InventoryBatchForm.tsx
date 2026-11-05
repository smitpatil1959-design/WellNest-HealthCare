import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { InventoryItem } from '../../types/pharmacy';

const empty = { name: '', sku: '', form: '', strength: '', lot: '', expires: '', onHand: 0, reorder: 0, controlled: false };
export function InventoryBatchForm({ onSave }: { onSave: (input: Omit<InventoryItem, 'id' | 'version'>) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  return <div className="mb-6">
    <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{open ? 'Close batch form' : 'Add inventory batch'}</Button>
    {open && <Card className="mt-4"><form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={async event => {
      event.preventDefault(); if (saving) return; setSaving(true);
      try { if (await onSave(form)) { setForm(empty); setOpen(false); } } finally { setSaving(false); }
    }}>
      <Input required label="Medicine name" maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Input required label="SKU" maxLength={200} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
      <Input label="Form" value={form.form} onChange={e => setForm({ ...form, form: e.target.value })} />
      <Input label="Strength" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
      <Input required label="Batch / lot number" value={form.lot} onChange={e => setForm({ ...form, lot: e.target.value })} />
      <Input required label="Expiry date" type="date" value={form.expires} onChange={e => setForm({ ...form, expires: e.target.value })} />
      <Input required label="Units on hand" type="number" min={0} max={10000000} step={1} value={form.onHand} onChange={e => setForm({ ...form, onHand: Number(e.target.value) })} />
      <Input required label="Reorder threshold" type="number" min={0} step={1} value={form.reorder} onChange={e => setForm({ ...form, reorder: Number(e.target.value) })} />
      <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.controlled} onChange={e => setForm({ ...form, controlled: e.target.checked })} />Controlled medication</label>
      <div className="sm:col-span-2 lg:col-span-3"><Button type="submit" loading={saving}>Save batch</Button></div>
    </form></Card>}
  </div>;
}
