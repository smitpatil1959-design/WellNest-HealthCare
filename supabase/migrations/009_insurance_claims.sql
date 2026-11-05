-- Forward-only insurance claim workflow foundation.
-- Reuses insurance_plans; no unrestricted clinical access is introduced.

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insurance_plan_id UUID REFERENCES public.insurance_plans(id) ON DELETE SET NULL,
  service_date DATE,
  service_type TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'documents', 'review', 'approved', 'rejected', 'paid')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insurance_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  storage_object_id UUID,
  document_type TEXT NOT NULL,
  source TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insurance_claims_org_status_idx
  ON public.insurance_claims(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS insurance_claims_patient_created_idx
  ON public.insurance_claims(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS insurance_claim_documents_claim_idx
  ON public.insurance_claim_documents(claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS insurance_claim_documents_storage_object_idx
  ON public.insurance_claim_documents(storage_object_id)
  WHERE storage_object_id IS NOT NULL;

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.insurance_claims FROM anon, authenticated;
REVOKE ALL ON public.insurance_claim_documents FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.insurance_claims TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.insurance_claim_documents TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.insurance_plans TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'insurance_claim_documents_storage_object_fk'
  ) THEN
    ALTER TABLE public.insurance_claim_documents
      ADD CONSTRAINT insurance_claim_documents_storage_object_fk
      FOREIGN KEY (storage_object_id)
      REFERENCES public.storage_objects(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;
