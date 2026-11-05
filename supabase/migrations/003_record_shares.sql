-- Patient-approved, recipient-scoped share references for structured reports.
-- Run only after 001_core_tables.sql and 002_security_hardening.sql.
CREATE TABLE IF NOT EXISTS public.record_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id BIGINT NOT NULL REFERENCES public.access_grants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS record_shares_recipient_expiry_idx
  ON public.record_shares(recipient_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.record_shares ENABLE ROW LEVEL SECURITY;
-- No browser-role policies: all access is mediated by authenticated API handlers
-- using the server-only service role and rechecked against the current consent grant.
REVOKE ALL ON public.record_shares FROM anon, authenticated;
