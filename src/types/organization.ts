export type OrganizationKind = 'hospital' | 'laboratory' | 'pharmacy' | 'insurance';
export type OrganizationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface OrganizationProfile {
  id: string;
  kind: OrganizationKind;
  legal_name: string;
  display_name: string;
  registration_number?: string | null;
  license_number?: string | null;
  accreditation?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  operating_hours?: string | null;
  description?: string | null;
  services?: string[] | null;
  status: OrganizationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationContextResponse {
  success: boolean;
  organization: OrganizationProfile;
  membership: OrganizationMembership;
  member_count: number;
}

export interface OrganizationCompleteness {
  percent: number;
  missing: string[];
}

export function computeOrgCompleteness(org?: OrganizationProfile | null): OrganizationCompleteness {
  if (!org) {
    return { percent: 0, missing: ['Organization record unavailable'] };
  }

  const checks: { label: string; ok: boolean }[] = [
    { label: 'Display name', ok: Boolean(org.display_name?.trim()) },
    { label: 'Legal name', ok: Boolean(org.legal_name?.trim()) },
    { label: 'Registration or license', ok: Boolean(org.registration_number?.trim() || org.license_number?.trim()) },
    { label: 'Contact phone', ok: Boolean(org.phone?.trim()) },
    { label: 'Contact email', ok: Boolean(org.email?.trim()) },
    { label: 'Street address', ok: Boolean(org.address_line_1?.trim()) },
    { label: 'City and state', ok: Boolean(org.city?.trim() && org.state?.trim()) },
    { label: 'Postal code', ok: Boolean(org.postal_code?.trim()) },
    { label: 'Operating hours', ok: Boolean(org.operating_hours?.trim()) },
    { label: 'Services or capabilities', ok: Array.isArray(org.services) && org.services.length > 0 },
  ];

  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const met = checks.length - missing.length;
  const percent = Math.round((met / checks.length) * 100);

  return { percent, missing };
}
