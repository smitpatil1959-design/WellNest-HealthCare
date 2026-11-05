import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

const workspaceForRole = {
  patient: '/app/patient',
  doctor: '/app/doctor',
  hospital: '/app/hospital',
  laboratory: '/app/laboratory',
  pharmacy: '/app/pharmacy',
  insurance: '/app/insurance',
  administrator: '/app/admin',
};

function hrefFor(role, kind) {
  if (kind === 'access_request') return '/app/patient/requests';
  if (kind === 'access_decision') return role === 'doctor' ? '/app/doctor/patients' : `${workspaceForRole[role] || '/app'}/notifications`;
  if (kind === 'report_release') return '/app/patient/labs';
  if (kind === 'prescription') return '/app/patient/prescriptions';
  if (kind === 'appointment') return role === 'patient' ? '/app/patient/appointments' : `${workspaceForRole[role] || '/app'}/appointments`;
  return `${workspaceForRole[role] || '/app'}/notifications`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  if (!auth.role) return res.status(403).json({ success: false, error: 'Verified account role required.' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_notifications')
        .select('id,kind,title,body,created_at,read_at')
        .eq('recipient_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return res.status(200).json((data ?? []).map((row) => ({
        ...row,
        read: Boolean(row.read_at),
        href: hrefFor(auth.role, row.kind),
      })));
    }

    if (req.method === 'PATCH') {
      const { id, read } = req.body || {};
      if (typeof id !== 'string' || typeof read !== 'boolean') {
        return res.status(400).json({ success: false, error: 'A notification id and boolean read value are required.' });
      }
      const { data, error } = await supabase.from('app_notifications')
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq('id', id)
        .eq('recipient_id', auth.userId)
        .select('id,read_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Notification not found.' });
      return res.status(200).json({ success: true, id: data.id, read: Boolean(data.read_at) });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[app-notifications error]', error instanceof Error ? error.message : 'Request failed');
    return res.status(503).json({ success: false, error: 'Notification storage is unavailable.' });
  }
}
