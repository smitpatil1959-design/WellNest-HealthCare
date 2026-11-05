-- Forward-only pharmacy prescription workflow foundation.
-- Inventory is intentionally not included in the first production rollout.

CREATE TABLE IF NOT EXISTS public.pharmacy_prescription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  dispensing_status TEXT NOT NULL DEFAULT 'pending' CHECK (dispensing_status IN ('pending', 'verifying', 'processing', 'ready', 'completed', 'cancelled')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  filled_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prescription_id, organization_id)
);

CREATE INDEX IF NOT EXISTS pharmacy_events_org_status_idx
  ON public.pharmacy_prescription_events(organization_id, dispensing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS pharmacy_events_patient_idx
  ON public.pharmacy_prescription_events(patient_user_id, created_at DESC);

ALTER TABLE public.pharmacy_prescription_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pharmacy_prescription_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pharmacy_prescription_events TO service_role;
