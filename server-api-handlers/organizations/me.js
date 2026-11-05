import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { getActiveMembership, writeAudit } from '../organization-context.js';

const ORG_ADMIN_ROLES = ['hospital_admin', 'laboratory_admin', 'pharmacy_admin', 'insurance_admin'];

const ALLOWED_PROFILE_KEYS = [
  'phone',
  'email',
  'website',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'postal_code',
  'country',
  'license_number',
  'accreditation',
  'operating_hours',
  'description',
  'services',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])) {
    return res.status(403).json({ success: false, error: 'Verified staff account required.' });
  }

  try {
    const context = await getActiveMembership(auth);
    if (!context) {
      return res.status(403).json({ success: false, error: 'Active verified organization membership required.' });
    }

    if (req.method === 'GET') {
      const { count: memberCount } = await supabase
        .from('organization_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', context.organization.id)
        .eq('status', 'active');

      return res.status(200).json({
        success: true,
        organization: context.organization,
        membership: context.membership,
        member_count: typeof memberCount === 'number' ? memberCount : 1,
      });
    }

    if (req.method === 'PATCH') {
      if (!ORG_ADMIN_ROLES.includes(context.membership.role)) {
        return res.status(403).json({
          success: false,
          error: 'Organization administrator privileges required to update organization profile.',
        });
      }

      const body = req.body || {};
      const updates = {};

      for (const key of ALLOWED_PROFILE_KEYS) {
        if (body[key] !== undefined) {
          if (key === 'services') {
            updates.services = Array.isArray(body.services) ? body.services.filter((s) => typeof s === 'string') : [];
          } else if (typeof body[key] === 'string') {
            updates[key] = body[key].trim();
          } else if (body[key] === null) {
            updates[key] = null;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No editable organization fields provided.' });
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', context.organization.id)
        .select('id,kind,legal_name,display_name,registration_number,license_number,accreditation,phone,email,website,address_line_1,address_line_2,city,state,postal_code,country,operating_hours,description,services,status,verified_at,verified_by,created_at,updated_at')
        .single();

      if (error) throw error;

      await writeAudit(
        auth,
        'organization_profile_updated',
        'organization',
        context.organization.id,
        context.organization.id,
        'ok',
        { updated_fields: Object.keys(updates) },
      );

      return res.status(200).json({ success: true, organization: data });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error("[organizations/me error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization service is unavailable.' });
  }
}
