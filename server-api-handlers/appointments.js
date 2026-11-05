import supabase from './db-client.js';
import { hasVerifiedRole, verifyAuth } from './auth-guard.js';
import { getActiveMembership } from './organization-context.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export function createAppointmentsHandler({ database = supabase, authenticate = verifyAuth, membership = getActiveMembership } = {}) {
  return async function handler(req, res) {
  const supabase = database;
  const getActiveMembership = membership;
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await authenticate(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  const userId = auth.userId;

  if (req.method === 'PATCH') {
    if (auth.role === 'patient') {
      const { id, action, date, time, slotId } = req.body || {};
      if (!id || !['cancel', 'reschedule'].includes(action)) return res.status(400).json({ error: 'Choose an appointment action.' });
      let updates = { status: 'canceled' };
      if (action === 'reschedule') {
        const existing = await supabase.from('appointments').select('id,doctor_id,title,reason').eq('id', id).eq('patient_id', userId).eq('status', 'upcoming').maybeSingle();
        if (existing.error) return res.status(503).json({ error: 'Appointment could not be loaded.' });
        if (!existing.data) return res.status(409).json({ error: 'This appointment cannot be rescheduled.' });
        if (slotId) {
          const saved = await supabase.rpc('book_appointment_slot', { p_patient: userId, p_doctor: existing.data.doctor_id, p_slot: slotId, p_title: existing.data.title, p_reason: existing.data.reason || '', p_appointment: id });
          if (['PT409', '40001', '23505'].includes(saved.error?.code)) return res.status(409).json({ error: 'That slot was just reserved. Choose another time.' });
          if (saved.error) return res.status(503).json({ error: 'Appointment could not be rescheduled.' });
          return res.status(200).json(saved.data);
        }
        const schedule = await supabase.from('doctor_schedules').select('enabled').eq('doctor_id', existing.data.doctor_id).maybeSingle();
        if (schedule.error) return res.status(503).json({ error: 'Doctor schedule is unavailable.' });
        if (schedule.data?.enabled) return res.status(400).json({ error: 'Choose an available slot from the doctor’s calendar.' });
        if (!validAppointmentTime(date, time)) return res.status(400).json({ error: 'Choose a valid future date and time.' });
        updates = { date, time };
      }
      const { data, error } = await supabase.from('appointments').update(updates)
        .eq('id', id).eq('patient_id', userId).eq('status', 'upcoming').select('id,date,time,status').maybeSingle();
      if (error?.code === '23505') return res.status(409).json({ error: 'That clinician slot is already booked. Choose another time.' });
      if (error) return res.status(503).json({ error: 'Appointment could not be changed.' });
      if (!data) return res.status(409).json({ error: 'This appointment is no longer available to change.' });
      return res.status(200).json(data);
    }
    if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'Verified Doctor account required.' });
    const docContext = await getActiveMembership(auth, ['doctor']);
    if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
    const { id, status } = req.body || {};
    const allowedStatuses = ['in-progress', 'completed', 'canceled'];
    if (!id || !allowedStatuses.includes(status)) return res.status(400).json({ success: false, error: 'Appointment id and a supported status are required.' });
    try {
      const { data, error } = await supabase.from('appointments')
        .update({ status })
        .eq('id', id)
        .eq('doctor_id', userId)
        .select('id,title,date,time,status')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Appointment not found for this doctor.' });
      return res.status(200).json(data);
    } catch (err) {
      console.error("[appointments PATCH error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Appointment could not be updated.' });
    }
  }

  if (req.method === 'POST') {
    if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Patient account required.' });
    const { doctorId, title, reason, date, time, slotId } = req.body || {};
    if (slotId) {
      if (!doctorId || typeof title !== 'string' || !title.trim() || title.length > 120 || typeof (reason || '') !== 'string' || (reason || '').length > 500) return res.status(400).json({ error: 'Doctor and valid appointment details are required.' });
      const { data: activeDoctor, error: profileError } = await supabase.from('profiles').select('role,role_verified,account_status').eq('id', doctorId).maybeSingle();
      if (profileError) return res.status(503).json({ error: 'Doctor directory is unavailable.' });
      if (!activeDoctor || activeDoctor.role !== 'doctor' || !activeDoctor.role_verified || activeDoctor.account_status === 'suspended') return res.status(400).json({ error: 'Choose a verified active doctor.' });
      const saved = await supabase.rpc('book_appointment_slot', { p_patient: userId, p_doctor: doctorId, p_slot: slotId, p_title: title.trim(), p_reason: String(reason || '').trim(), p_appointment: null });
      if (['PT409', '40001', '23505'].includes(saved.error?.code)) return res.status(409).json({ error: 'That slot was just reserved. Choose another time.' });
      if (saved.error) return res.status(503).json({ error: 'Appointment could not be saved.' });
      return res.status(201).json(saved.data);
    }
    if (!doctorId || !title || !date || !time) return res.status(400).json({ success: false, error: 'Doctor, appointment type, date and time are required.' });
    if (!validAppointmentTime(date, time)) {
      return res.status(400).json({ success: false, error: 'Choose a valid future appointment date and time.' });
    }
    try {
      const schedule = await supabase.from('doctor_schedules').select('enabled').eq('doctor_id', doctorId).maybeSingle();
      if (schedule.error) throw schedule.error;
      if (schedule.data?.enabled) return res.status(400).json({ error: 'Choose an available slot from the doctor’s calendar.' });
      const { data: doctor, error: doctorError } = await supabase.from('profiles')
        .select('id,full_name,organization,role,role_verified')
        .eq('id', doctorId).eq('role', 'doctor').eq('role_verified', true).maybeSingle();
      if (doctorError) throw doctorError;
      if (!doctor) return res.status(404).json({ success: false, error: 'Verified doctor not found.' });
      const { data, error } = await supabase.from('appointments').insert({
        patient_id: userId,
        doctor_id: doctor.id,
        doctor: doctor.full_name,
        hospital: doctor.organization || '',
        title: String(title).trim(),
        reason: String(reason || '').trim(),
        date,
        time: String(time).trim(),
        status: 'upcoming',
      }).select('id,doctor,title,reason,hospital,date,time,status,created_at').single();
      if (error?.code === '23505') return res.status(409).json({ error: 'That clinician slot is already booked. Choose another time.' });
      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      console.error("[appointments POST error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Appointment could not be saved.' });
    }
  }

  if (req.method === 'GET') {
    try {
      if (auth.role === 'patient') {
        const { data, error } = await supabase.from('appointments')
          .select('id,doctor_id,doctor,title,reason,hospital,date,time,status,created_at,slot_id,starts_at,ends_at,timezone')
          .eq('patient_id', userId)
          .order('date', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data ?? []);
      }

      if (!hasVerifiedRole(auth, ['doctor'])) return res.status(403).json({ success: false, error: 'Patient or verified Doctor account required.' });
      const docContext = await getActiveMembership(auth, ['doctor']);
      if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
      const { data: appointments, error: appointmentError } = await supabase.from('appointments')
        .select('id,patient_id,title,reason,date,time,status,created_at')
        .eq('doctor_id', userId)
        .order('date', { ascending: true });
      if (appointmentError) throw appointmentError;

      const rows = appointments ?? [];
      const patientIds = [...new Set(rows.map((row) => row.patient_id).filter(Boolean))];
      const grantsByPatient = new Map();
      if (patientIds.length) {
        const now = new Date().toISOString();
        const { data: grants, error: grantError } = await supabase.from('access_grants')
          .select('id,patient_user_id,patient_name,expires_at')
          .eq('requester_id', userId)
          .eq('status', 'active')
          .is('revoked_at', null)
          .in('patient_user_id', patientIds)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('created_at', { ascending: false });
        if (grantError) throw grantError;
        for (const grant of grants ?? []) {
          if (!grantsByPatient.has(grant.patient_user_id)) grantsByPatient.set(grant.patient_user_id, grant);
        }
      }

      return res.status(200).json(rows.map((appointment) => {
        const grant = grantsByPatient.get(appointment.patient_id);
        return {
          id: appointment.id,
          title: appointment.title,
          reason: grant ? appointment.reason : null,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          created_at: appointment.created_at,
          grant_id: grant?.id ?? null,
          patient_name: grant?.patient_name ?? null,
        };
      }));
    } catch (err) {
      console.error("[appointments GET error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Appointment storage is unavailable.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
  };
}

export function validAppointmentTime(date, time) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date && date >= new Date().toISOString().slice(0, 10);
}
export default createAppointmentsHandler();
