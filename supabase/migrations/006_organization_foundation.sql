-- Forward-only organization and membership foundation.
-- Apply only after production schema review. Never trusts browser role or organization values.

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('hospital', 'laboratory', 'pharmacy', 'insurance')),
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  registration_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organization_memberships_role_check CHECK (role IN (
    'doctor',
    'hospital_admin', 'hospital_doctor', 'hospital_receptionist', 'hospital_nurse', 'hospital_laboratory',
    'laboratory_admin', 'laboratory_director', 'laboratory_pathologist', 'laboratory_technologist', 'laboratory_receptionist',
    'pharmacy_admin', 'pharmacist', 'pharmacy_technician', 'pharmacy_cashier',
    'insurance_admin', 'insurance_reviewer', 'insurance_policy_manager', 'insurance_support', 'insurance_auditor'
  ))
);

CREATE TABLE IF NOT EXISTS public.organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_object_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  result TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_registration_number_idx
  ON public.organizations(registration_number)
  WHERE registration_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS organizations_kind_status_idx
  ON public.organizations(kind, status);
CREATE UNIQUE INDEX IF NOT EXISTS organization_memberships_user_org_idx
  ON public.organization_memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS organization_memberships_user_status_idx
  ON public.organization_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS organization_memberships_org_status_idx
  ON public.organization_memberships(organization_id, status);
CREATE INDEX IF NOT EXISTS organization_documents_org_status_idx
  ON public.organization_documents(organization_id, status);
CREATE INDEX IF NOT EXISTS audit_events_org_created_idx
  ON public.audit_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON public.audit_events(actor_user_id, created_at DESC);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.organizations FROM anon, authenticated;
REVOKE ALL ON public.organization_memberships FROM anon, authenticated;
REVOKE ALL ON public.organization_documents FROM anon, authenticated;
REVOKE ALL ON public.audit_events FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.organization_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.organization_documents TO service_role;
GRANT SELECT, INSERT ON public.audit_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_events_id_seq TO service_role;
