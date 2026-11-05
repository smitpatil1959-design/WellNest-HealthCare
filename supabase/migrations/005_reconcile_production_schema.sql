-- Forward-only production reconciliation for the confirmed Supabase schema.
-- Run only after a read-only audit confirms the target production project.
-- This migration does not verify staff accounts or modify production data rows.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS professional_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS health_id TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_role TEXT,
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

ALTER TABLE public.access_grants
  ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES public.access_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_role TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS access_requests_patient_created_idx
  ON public.access_requests(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_requests_requester_created_idx
  ON public.access_requests(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_grants_patient_created_idx
  ON public.access_grants(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_grants_requester_created_idx
  ON public.access_grants(requester_id, created_at DESC);

-- New accounts are always least-privileged patients. Existing rows are not
-- updated, so no existing staff account is automatically verified.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, role_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'patient',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Profiles remain readable by an authenticated browser only because the
-- current frontend resolves the verified role from this row. All profile
-- writes remain API/service-role mediated.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles: own row" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;

-- The frontend uses API endpoints for all clinical workflows. Remove browser
-- table privileges rather than relying only on RLS policies.
REVOKE ALL ON public.records,
                  public.appointments,
                  public.prescriptions,
                  public.lab_reports,
                  public.insurance_plans,
                  public.access_requests,
                  public.access_grants,
                  public.notification_preferences
  FROM anon, authenticated;

-- Health identities and record shares remain strictly API/service-role only.
ALTER TABLE public.health_identities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_identities: own row" ON public.health_identities;
DROP POLICY IF EXISTS "health_identities: public read" ON public.health_identities;
DROP POLICY IF EXISTS "health_identities: no direct client access" ON public.health_identities;
CREATE POLICY "health_identities: no direct client access"
  ON public.health_identities FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
REVOKE ALL ON public.health_identities FROM anon, authenticated;

ALTER TABLE public.record_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.record_shares FROM anon, authenticated;

-- Notifications and audit logs are API/service-role only.
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_notifications: no direct client access" ON public.app_notifications;
CREATE POLICY "app_notifications: no direct client access"
  ON public.app_notifications FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
REVOKE ALL ON public.app_notifications FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.health_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  health_id TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_audit_logs: no direct client access" ON public.health_audit_logs;
CREATE POLICY "health_audit_logs: no direct client access"
  ON public.health_audit_logs FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
REVOKE ALL ON public.health_audit_logs FROM anon, authenticated;

-- Explicit service-role access required by API handlers and notification
-- functions. No browser role receives access to these API-only tables.
GRANT SELECT, INSERT ON public.records TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO service_role;
GRANT SELECT, INSERT ON public.prescriptions TO service_role;
GRANT SELECT ON public.lab_reports TO service_role;
GRANT SELECT ON public.insurance_plans TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.access_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.access_grants TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.health_identities TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.record_shares TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.app_notifications TO service_role;
GRANT SELECT, INSERT ON public.health_audit_logs TO service_role;

-- BIGSERIAL-backed API inserts require sequence privileges.
GRANT USAGE, SELECT ON SEQUENCE public.health_identities_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.access_requests_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.access_grants_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.health_audit_logs_id_seq TO service_role;

CREATE INDEX IF NOT EXISTS app_notifications_recipient_created_idx
  ON public.app_notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS health_audit_logs_health_created_idx
  ON public.health_audit_logs(health_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_access_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.app_notifications(recipient_id, kind, title, body)
  VALUES (
    NEW.patient_user_id,
    'access_request',
    'Access request needs your decision',
    COALESCE(NEW.requester_name, 'A verified care provider') || ' requested access.'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_access_request_decided()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('approved', 'denied')
     AND NEW.requester_id IS NOT NULL THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (
      NEW.requester_id,
      'access_decision',
      'Patient responded to your access request',
      'The request was ' || NEW.status || '.'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.doctor_id IS NOT NULL THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.doctor_id, 'appointment', 'Appointment requested', 'A patient requested an appointment.');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.patient_id, 'appointment', 'Appointment updated',
      'Your appointment status changed to ' || NEW.status || '.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_prescription_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.app_notifications(recipient_id, kind, title, body)
  VALUES (NEW.patient_id, 'prescription', 'Prescription issued',
    'A new prescription was added to your record.');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_lab_report_released()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.released_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.released_at IS NULL) THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.patient_id, 'report_release', 'Lab report released',
      'A lab report is available in your records.');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_access_request_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_access_request_decided() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_appointment_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_prescription_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_lab_report_released() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS app_notify_access_request_created ON public.access_requests;
CREATE TRIGGER app_notify_access_request_created
  AFTER INSERT ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request_created();

DROP TRIGGER IF EXISTS app_notify_access_request_decided ON public.access_requests;
CREATE TRIGGER app_notify_access_request_decided
  AFTER UPDATE OF status ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request_decided();

DROP TRIGGER IF EXISTS app_notify_appointment_change ON public.appointments;
CREATE TRIGGER app_notify_appointment_change
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();

DROP TRIGGER IF EXISTS app_notify_prescription_created ON public.prescriptions;
CREATE TRIGGER app_notify_prescription_created
  AFTER INSERT ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_prescription_created();

DROP TRIGGER IF EXISTS app_notify_lab_report_released ON public.lab_reports;
CREATE TRIGGER app_notify_lab_report_released
  AFTER INSERT OR UPDATE OF released_at ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_lab_report_released();

-- Existing staff remain unverified. Verification is an administrator action.
