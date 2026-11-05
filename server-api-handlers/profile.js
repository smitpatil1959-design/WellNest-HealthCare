import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await verifyAuth(req);

  if (req.method === 'GET') {
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
    const userId = auth.userId;

    try {
      // Columns from migration 001 (always present) plus 002 additions.
      // Until migration 005 is applied, the 002 columns return null; authService.ts
      // coalesces all optional fields so frontend degradation is safe.
      const { data, error } = await supabase.from('profiles')
        .select('id,email,role,full_name,organization,phone,language,avatar_url,blood_group,allergies,conditions,medications_list,emergency_contact_name,emergency_contact_relation,emergency_contact_phone,created_at,updated_at,role_verified,organization_id,date_of_birth,gender,address,license_number,professional_title,specialty,onboarding_completed')
        .eq('id', userId).maybeSingle();
      if (error) throw error;
      return res.status(200).json({ success: true, profile: data ?? null });
    } catch (err) {
      console.error("[profile GET error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Profile storage is unavailable.' });
    }
  }

  if (req.method === 'PUT') {
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
    const body = req.body || {};
    const allowed = ['full_name', 'organization', 'phone', 'language', 'avatar_url', 'blood_group', 'allergies', 'conditions', 'medications_list', 'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone', 'date_of_birth', 'gender', 'address', 'license_number', 'professional_title', 'specialty', 'onboarding_completed'];
    const profile = Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, body[key]]));
    try {
      let verifiedDoctorProfile = null;
      if (auth.role === 'doctor') {
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          // role and role_verified are the minimum needed; other columns may not
          // exist until migration 005 is applied — select only what 001 guarantees.
          .select('role,full_name,organization')
          .eq('id', auth.userId)
          .maybeSingle();
        if (profileError) throw profileError;
        // role_verified is a 002-migration column. When absent, treat as false.
        if (!currentProfile || currentProfile.role !== 'doctor') {
          return res.status(403).json({ success: false, error: 'A verified doctor profile is required.' });
        }
        verifiedDoctorProfile = currentProfile;

        const trustedFields = ['full_name', 'organization', 'license_number', 'professional_title', 'specialty'];
        for (const field of trustedFields) {
          if (!(field in profile)) continue;
          if (typeof profile[field] !== 'string') {
            return res.status(400).json({ success: false, error: `${field} must be text.` });
          }
          const currentValue = String(currentProfile[field] ?? '').trim();
          const nextValue = profile[field].trim();
          // A verified doctor's identity and organization are administrator-
          // managed, including when a legacy profile field is still blank.
          // This prevents self-attribution changes in clinical and audit APIs.
          if (nextValue !== currentValue) {
            return res.status(403).json({
              success: false,
              error: 'Verified professional identity and organization details can only be changed by an administrator.',
            });
          }
        }
      }

      if (profile.onboarding_completed === true) {
        if (!auth.role) return res.status(403).json({ success: false, error: 'A verified database role is required to complete workspace onboarding.' });
        const requiredByRole = {
          patient: ['full_name', 'phone', 'date_of_birth', 'gender', 'blood_group', 'address', 'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone'],
          doctor: ['full_name', 'phone', 'organization', 'professional_title', 'license_number', 'specialty'],
          hospital: ['full_name', 'phone', 'organization'],
          laboratory: ['full_name', 'phone', 'organization', 'license_number'],
          pharmacy: ['full_name', 'phone', 'organization', 'license_number'],
          insurance: ['full_name', 'phone', 'organization'],
          administrator: ['full_name', 'phone', 'organization'],
        };
        const completionValues = auth.role === 'doctor' && verifiedDoctorProfile
          ? {
              ...profile,
              full_name: verifiedDoctorProfile.full_name,
              organization: verifiedDoctorProfile.organization,
              professional_title: verifiedDoctorProfile.professional_title,
              license_number: verifiedDoctorProfile.license_number,
              specialty: verifiedDoctorProfile.specialty,
            }
          : profile;
        const missing = (requiredByRole[auth.role] || []).filter((key) => typeof completionValues[key] !== 'string' || !completionValues[key].trim());
        if (missing.length) return res.status(400).json({ success: false, error: 'Complete all required profile fields before finishing onboarding.', fields: missing });
      }
      for (const field of ['allergies', 'conditions', 'medications_list']) {
        if (field in profile && (!Array.isArray(profile[field]) || profile[field].some((item) => typeof item !== 'string'))) {
          return res.status(400).json({ success: false, error: `${field} must be a list of text values.` });
        }
      }
      if ('date_of_birth' in profile && profile.date_of_birth !== null && (typeof profile.date_of_birth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(profile.date_of_birth))) {
        return res.status(400).json({ success: false, error: 'date_of_birth must use YYYY-MM-DD format.' });
      }
      if ('onboarding_completed' in profile && typeof profile.onboarding_completed !== 'boolean') {
        return res.status(400).json({ success: false, error: 'onboarding_completed must be a boolean.' });
      }
      const { error } = await supabase.from('profiles').upsert({
        id: auth.userId,
        ...profile,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[profile PUT error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Profile could not be saved.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
