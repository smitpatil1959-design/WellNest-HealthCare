import supabase from '../db-client.js';
import { verifyAuth, hasVerifiedRole } from '../auth-guard.js';
import { getActiveMembership } from '../organization-context.js';

export const inventoryView = row => ({ id: row.id, name: row.name, sku: row.sku, form: row.form, strength: row.strength, onHand: row.on_hand, reorder: row.reorder, expires: row.expires, lot: row.lot, controlled: row.controlled, version: row.version });
export function validateInventory(input) {
  const out = {};
  for (const key of ['name', 'sku', 'form', 'strength', 'lot', 'expires']) {
    if (typeof input?.[key] !== 'string' || input[key].length > 200) throw new Error(`Invalid ${key}.`);
    out[key] = input[key].trim();
  }
  if (!out.name || !out.sku || !out.lot || !/^\d{4}-\d{2}-\d{2}$/.test(out.expires) || new Date(`${out.expires}T00:00:00Z`).toISOString().slice(0, 10) !== out.expires) throw new Error('Medicine, SKU, lot and a valid expiry date are required.');
  if (typeof input.controlled !== 'boolean') throw new Error('Controlled status is required.');
  out.controlled = input.controlled;
  for (const key of ['onHand', 'reorder']) {
    if (!Number.isSafeInteger(input[key]) || input[key] < 0 || input[key] > 10000000) throw new Error('Stock counts must be nonnegative whole numbers.');
  }
  out.on_hand = input.onHand;
  out.reorder = input.reorder;
  return out;
}
export function createInventoryHandler({ db = supabase, authenticate = verifyAuth, membership = getActiveMembership } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ error: 'Sign in to continue.' });
    if (!hasVerifiedRole(auth, ['pharmacy'])) return res.status(403).json({ error: 'Verified pharmacy account required.' });
    try {
      const context = await membership(auth, ['pharmacy_admin', 'pharmacist', 'pharmacy_technician']);
      if (!context || context.organization.kind !== 'pharmacy') return res.status(403).json({ error: 'Authorized pharmacy inventory access required.' });
      const org = context.organization.id;
      if (req.method === 'GET') {
        const { data, error } = await db.from('pharmacy_inventory').select('*').eq('organization_id', org).order('name');
        if (error) throw error;
        return res.status(200).json((data || []).map(inventoryView));
      }
      if (!['pharmacy_admin', 'pharmacist'].includes(context.membership.role)) return res.status(403).json({ error: 'A pharmacist must authorize inventory changes.' });
      if (req.method === 'POST') {
        let payload;
        try { payload = validateInventory(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
        const { data, error } = await db.from('pharmacy_inventory').insert({ ...payload, organization_id: org, updated_by: auth.userId }).select('*').single();
        if (error?.code === '23505') return res.status(409).json({ error: 'This SKU and batch already exist.' });
        if (error) throw error;
        return res.status(201).json(inventoryView(data));
      }
      const { id, version, onHand } = req.body || {};
      if (!id || !Number.isSafeInteger(version) || version < 1 || !Number.isSafeInteger(onHand) || onHand < 0 || onHand > 10000000) return res.status(400).json({ error: 'A current inventory item and valid stock count are required.' });
      const { data, error } = await db.from('pharmacy_inventory').update({ on_hand: onHand, version: version + 1, updated_by: auth.userId, updated_at: new Date().toISOString() })
        .eq('id', id).eq('organization_id', org).eq('version', version).select('*').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(409).json({ error: 'Stock changed since you opened it. Refresh before adjusting it.' });
      return res.status(200).json(inventoryView(data));
    } catch (error) {
      console.error('[inventory]', error?.code || 'unavailable');
      return res.status(503).json({ error: 'Inventory is unavailable. Check the database setup and retry.' });
    }
  };
}
export default createInventoryHandler();
