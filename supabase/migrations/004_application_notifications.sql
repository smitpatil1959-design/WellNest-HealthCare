-- Persistent in-app notification feed and read state for the existing core workflows.
-- This object does not exist in migrations 001-003 or in the configured project's
-- read-only PostgREST schema probe. Run after 001-003.

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS app_notifications_recipient_created_idx
  ON public.app_notifications(recipient_id, created_at DESC);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_notifications: no direct client access" ON public.app_notifications;
CREATE POLICY "app_notifications: no direct client access"
  ON public.app_notifications FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
REVOKE ALL ON public.app_notifications FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_access_request_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.app_notifications(recipient_id, kind, title, body)
  VALUES (NEW.patient_user_id, 'access_request', 'Access request needs your decision',
    coalesce(NEW.requester_name, 'A verified care provider') || ' requested access.');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_access_request_decided()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'denied') AND NEW.requester_id IS NOT NULL THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.requester_id, 'access_decision', 'Patient responded to your access request',
      'The request was ' || NEW.status || '.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.doctor_id IS NOT NULL THEN
      INSERT INTO public.app_notifications(recipient_id, kind, title, body)
      VALUES (NEW.doctor_id, 'appointment', 'Appointment requested', 'A patient requested an appointment.');
    END IF;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.patient_id, 'appointment', 'Appointment updated', 'Your appointment status changed to ' || NEW.status || '.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_prescription_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.app_notifications(recipient_id, kind, title, body)
  VALUES (NEW.patient_id, 'prescription', 'Prescription issued', 'A new prescription was added to your record.');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_lab_report_released()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.released_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.released_at IS NULL) THEN
    INSERT INTO public.app_notifications(recipient_id, kind, title, body)
    VALUES (NEW.patient_id, 'report_release', 'Lab report released', 'A lab report is available in your records.');
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
CREATE TRIGGER app_notify_access_request_created AFTER INSERT ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request_created();
DROP TRIGGER IF EXISTS app_notify_access_request_decided ON public.access_requests;
CREATE TRIGGER app_notify_access_request_decided AFTER UPDATE OF status ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request_decided();
DROP TRIGGER IF EXISTS app_notify_appointment_change ON public.appointments;
CREATE TRIGGER app_notify_appointment_change AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();
DROP TRIGGER IF EXISTS app_notify_prescription_created ON public.prescriptions;
CREATE TRIGGER app_notify_prescription_created AFTER INSERT ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_prescription_created();
DROP TRIGGER IF EXISTS app_notify_lab_report_released ON public.lab_reports;
CREATE TRIGGER app_notify_lab_report_released AFTER INSERT OR UPDATE OF released_at ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_lab_report_released();
