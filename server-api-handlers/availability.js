import supabase from './db-client.js';
import { verifyAuth, hasVerifiedRole } from './auth-guard.js';
import { getActiveMembership } from './organization-context.js';

export function createAvailabilityHandler({ db = supabase, authenticate = verifyAuth, membership = getActiveMembership } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ error: auth.error || 'Sign in to continue.' });
    try {
      const doctor = hasVerifiedRole(auth, ['doctor']);
      const doctorId = doctor ? auth.userId : String(req.query?.doctorId || '');
      if (!doctor && auth.role !== 'patient') return res.status(403).json({ error: 'Patient or verified doctor account required.' });
      if (!doctorId) return res.status(400).json({ error: 'Choose a doctor.' });
      let context = null;
      if (doctor) {
        context = await membership(auth, ['doctor']);
        if (!context) return res.status(403).json({ error: 'Active verified doctor membership required.' });
      }
      if (req.method === 'GET') {
        const schedule = await db.from('doctor_schedules').select('enabled,timezone').eq('doctor_id', doctorId).maybeSingle();
        if (schedule.error) throw schedule.error;
        const slots = await db.from('appointment_slots').select('id,doctor_id,starts_at,ends_at,timezone,closed').eq('doctor_id', doctorId).eq('closed', false).gt('starts_at', new Date().toISOString()).order('starts_at').limit(200);
        if (slots.error) throw slots.error;
        const ids = (slots.data || []).map(slot => slot.id);
        const booked = ids.length ? await db.from('appointments').select('slot_id').in('slot_id', ids).neq('status', 'canceled') : { data: [] };
        if (booked.error) throw booked.error;
        const reserved = new Set((booked.data || []).map(row => row.slot_id));
        return res.status(200).json({ enabled: schedule.data?.enabled || false, timezone: schedule.data?.timezone || null, slots: (slots.data || []).filter(slot => doctor || !reserved.has(slot.id)).map(slot => ({ ...slot, booked: reserved.has(slot.id) })) });
      }
      if (!doctor) return res.status(403).json({ error: 'Only the doctor can manage availability.' });
      const { startsAt, endsAt, timezone, id } = req.body || {};
      if (req.method === 'PATCH' && !id) return res.status(400).json({ error: 'Choose a slot.' });
      if (req.method === 'POST' && (!Number.isFinite(Date.parse(startsAt)) || !Number.isFinite(Date.parse(endsAt)) || Date.parse(startsAt) <= Date.now() || Date.parse(endsAt) <= Date.parse(startsAt) || Date.parse(endsAt) - Date.parse(startsAt) > 14400000)) return res.status(400).json({ error: 'Choose a future slot lasting at most four hours.' });
      if (req.method === 'POST') {
        try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch { return res.status(400).json({ error: 'Choose a valid timezone.' }); }
      }
      const result = await db.rpc('manage_doctor_slot', { p_doctor: auth.userId, p_organization: context.organization.id, p_start: startsAt || null, p_end: endsAt || null, p_timezone: timezone || 'UTC', p_close: req.method === 'PATCH' ? id : null });
      if (['PT409', '40001', '23505'].includes(result.error?.code)) return res.status(409).json({ error: 'This slot overlaps another slot or has an active booking. Refresh the schedule.' });
      if (result.error?.code === '42501') return res.status(403).json({ error: 'Slot not available for this doctor.' });
      if (result.error) throw result.error;
      return res.status(req.method === 'POST' ? 201 : 200).json(result.data);
    } catch (error) { console.error('[availability]', error?.code || 'unavailable'); return res.status(503).json({ error: 'Availability could not be loaded or saved.' }); }
  };
}
export default createAvailabilityHandler();
