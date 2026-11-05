-- Apply after 012. All new tables are API-only. No live messages are sent by this migration.
BEGIN;
-- Protect the one browser-readable profile table as well as the server APIs.
CREATE OR REPLACE FUNCTION public.profile_second_factor_satisfied() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT coalesce((SELECT auth.jwt()->>'aal')='aal2',false)
    OR NOT EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id=auth.uid() AND status='verified');
$$;
REVOKE ALL ON FUNCTION public.profile_second_factor_satisfied() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.profile_second_factor_satisfied() TO authenticated;
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT TO authenticated
  USING(auth.uid()=id AND public.profile_second_factor_satisfied());
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  timezone TEXT NOT NULL DEFAULT 'UTC', enabled BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doctor_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, timezone TEXT NOT NULL,
  closed BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at>starts_at AND ends_at<=starts_at+interval '4 hours'),
  UNIQUE(doctor_id,starts_at)
);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES public.appointment_slots(id),
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_reserved_slot ON public.appointments(slot_id) WHERE status<>'canceled' AND slot_id IS NOT NULL;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.storage_objects WHERE lab_report_version_id IS NOT NULL AND deleted_at IS NULL GROUP BY lab_report_version_id HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Multiple active report attachments exist. Run migration_013_preflight.sql and review the versions before retrying. No changes were committed.';
  END IF;
END; $$;
CREATE UNIQUE INDEX IF NOT EXISTS lab_one_active_attachment ON public.storage_objects(lab_report_version_id)
  WHERE lab_report_version_id IS NOT NULL AND deleted_at IS NULL;
ALTER TABLE public.lab_reports ADD COLUMN IF NOT EXISTS source_version_id UUID REFERENCES public.lab_report_versions(id);
CREATE UNIQUE INDEX IF NOT EXISTS lab_released_source_version ON public.lab_reports(source_version_id) WHERE source_version_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.release_lab_report(p_version UUID,p_actor UUID,p_organization UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE version public.lab_report_versions; lab_order public.lab_orders; patient_report public.lab_reports;
BEGIN
  SELECT * INTO version FROM public.lab_report_versions WHERE id=p_version AND organization_id=p_organization FOR UPDATE;
  IF NOT FOUND OR version.status<>'verified' THEN RAISE EXCEPTION 'Only verified reports can be released' USING ERRCODE='40001'; END IF;
  IF EXISTS(SELECT 1 FROM public.storage_objects WHERE lab_report_version_id=p_version AND deleted_at IS NULL AND scan_status<>'clean') THEN RAISE EXCEPTION 'File scan has not cleared' USING ERRCODE='40001'; END IF;
  SELECT * INTO lab_order FROM public.lab_orders WHERE id=version.lab_order_id AND organization_id=p_organization FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE='42501'; END IF;
  UPDATE public.lab_report_versions SET status='published',released_by=p_actor,released_at=now(),updated_at=now() WHERE id=p_version RETURNING * INTO version;
  UPDATE public.lab_orders SET status='published',resulted_at=now(),updated_at=now() WHERE id=lab_order.id;
  INSERT INTO public.lab_reports(patient_id,lab_user_id,test_name,result,status,released_at,source_version_id)
  VALUES(version.patient_user_id,p_actor,lab_order.test_name,jsonb_build_object('impression',version.impression,'analytes',version.analytes,'version',version.version)::text,'released',now(),p_version) RETURNING * INTO patient_report;
  INSERT INTO public.audit_events(actor_user_id,organization_id,action,target_type,target_id,result)
    VALUES(p_actor,p_organization,'lab_report_released','lab_report_version',p_version::text,'ok');
  RETURN jsonb_build_object('version',to_jsonb(version),'report',to_jsonb(patient_report));
END; $$;

CREATE OR REPLACE FUNCTION public.decide_access_request(p_request BIGINT,p_actor UUID,p_status TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request public.access_requests; actor public.profiles;
BEGIN
  SELECT * INTO request FROM public.access_requests WHERE id=p_request FOR UPDATE;
  SELECT * INTO actor FROM public.profiles WHERE id=p_actor;
  IF request.id IS NULL OR actor.id IS NULL OR actor.account_status<>'active' OR
    NOT ((actor.role='patient' AND request.patient_user_id=p_actor) OR (actor.role='administrator' AND actor.role_verified)) THEN RAISE EXCEPTION 'Consent decision denied' USING ERRCODE='42501'; END IF;
  IF request.status<>'pending' OR p_status NOT IN ('approved','denied') THEN RAISE EXCEPTION 'Request already decided' USING ERRCODE='40001'; END IF;
  IF p_status='approved' THEN
    INSERT INTO public.access_grants(request_id,health_id,patient_user_id,patient_name,requester_id,requester_name,requester_role,organization,categories,status,expires_at)
    VALUES(request.id,request.health_id,request.patient_user_id,request.patient_name,request.requester_id,request.requester_name,request.requester_role,request.organization,request.categories,'active',now()+make_interval(hours=>least(720,greatest(1,request.duration_hours))));
  END IF;
  UPDATE public.access_requests SET status=p_status,decided_at=now() WHERE id=p_request RETURNING * INTO request;
  INSERT INTO public.health_audit_logs(actor_id,actor_name,actor_role,organization,action,health_id,result)
    VALUES(p_actor,coalesce(actor.full_name,''),actor.role,'',CASE WHEN p_status='approved' THEN 'consent_approved' ELSE 'consent_denied' END,request.health_id,'ok');
  RETURN to_jsonb(request);
END; $$;

CREATE OR REPLACE FUNCTION public.manage_doctor_slot(p_doctor UUID,p_organization UUID,p_start TIMESTAMPTZ,p_end TIMESTAMPTZ,p_timezone TEXT,p_close UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved public.appointment_slots;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_doctor::text,0));
  IF p_close IS NOT NULL THEN
    SELECT * INTO saved FROM public.appointment_slots WHERE id=p_close AND doctor_id=p_doctor AND organization_id=p_organization FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found' USING ERRCODE='42501'; END IF;
    IF EXISTS(SELECT 1 FROM public.appointments WHERE slot_id=p_close AND status<>'canceled') THEN RAISE EXCEPTION 'Cancel the booked appointment before closing its slot' USING ERRCODE='40001'; END IF;
    UPDATE public.appointment_slots SET closed=true WHERE id=p_close RETURNING * INTO saved;
  ELSE
    IF p_start<=now() OR p_end<=p_start OR p_end>p_start+interval '4 hours' OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=p_timezone) THEN RAISE EXCEPTION 'Invalid slot time' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM public.appointment_slots WHERE doctor_id=p_doctor AND NOT closed AND starts_at<p_end AND ends_at>p_start) THEN RAISE EXCEPTION 'Slot overlaps an existing slot' USING ERRCODE='40001'; END IF;
    INSERT INTO public.doctor_schedules(doctor_id,organization_id,timezone) VALUES(p_doctor,p_organization,p_timezone)
      ON CONFLICT(doctor_id) DO UPDATE SET timezone=EXCLUDED.timezone,enabled=true;
    INSERT INTO public.appointment_slots(doctor_id,organization_id,starts_at,ends_at,timezone) VALUES(p_doctor,p_organization,p_start,p_end,p_timezone) RETURNING * INTO saved;
  END IF;
  INSERT INTO public.audit_events(actor_user_id,organization_id,action,target_type,target_id,result)
    VALUES(p_doctor,p_organization,CASE WHEN p_close IS NULL THEN 'slot_created' ELSE 'slot_closed' END,'appointment_slot',saved.id::text,'ok');
  RETURN to_jsonb(saved);
END; $$;

CREATE OR REPLACE FUNCTION public.book_appointment_slot(p_patient UUID,p_doctor UUID,p_slot UUID,p_title TEXT,p_reason TEXT,p_appointment UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE selected public.appointment_slots; appointment public.appointments; old_appointment public.appointments;
BEGIN
  -- Lock the patient's current appointment before a reschedule and the requested slot before reservation.
  IF p_appointment IS NOT NULL THEN
    SELECT * INTO old_appointment FROM public.appointments WHERE id=p_appointment AND patient_id=p_patient AND doctor_id=p_doctor AND status='upcoming' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Appointment cannot be rescheduled' USING ERRCODE='42501'; END IF;
  END IF;
  SELECT * INTO selected FROM public.appointment_slots WHERE id=p_slot AND doctor_id=p_doctor AND NOT closed AND starts_at>now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot unavailable' USING ERRCODE='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.organization_memberships m JOIN public.organizations o ON o.id=m.organization_id JOIN public.profiles p ON p.id=m.user_id
    WHERE m.user_id=p_doctor AND m.organization_id=selected.organization_id AND m.role='doctor' AND m.status='active' AND m.verified_at IS NOT NULL AND o.status='verified' AND p.role='doctor' AND p.role_verified AND p.account_status='active') THEN
    RAISE EXCEPTION 'Doctor is not currently accepting bookings' USING ERRCODE='42501';
  END IF;
  IF EXISTS(SELECT 1 FROM public.appointments WHERE slot_id=p_slot AND status<>'canceled' AND (p_appointment IS NULL OR id<>p_appointment)) THEN RAISE EXCEPTION 'Slot already reserved' USING ERRCODE='40001'; END IF;
  IF p_appointment IS NULL THEN
    INSERT INTO public.appointments(patient_id,doctor_id,doctor,hospital,title,reason,date,time,status,slot_id,starts_at,ends_at,timezone)
    VALUES(p_patient,p_doctor,(SELECT full_name FROM public.profiles WHERE id=p_doctor),
      (SELECT display_name FROM public.organizations WHERE id=selected.organization_id),p_title,p_reason,
      (selected.starts_at AT TIME ZONE selected.timezone)::date,to_char(selected.starts_at AT TIME ZONE selected.timezone,'HH24:MI'),
      'upcoming',selected.id,selected.starts_at,selected.ends_at,selected.timezone) RETURNING * INTO appointment;
  ELSE
    UPDATE public.appointments SET slot_id=selected.id,starts_at=selected.starts_at,ends_at=selected.ends_at,timezone=selected.timezone,
      date=(selected.starts_at AT TIME ZONE selected.timezone)::date,time=to_char(selected.starts_at AT TIME ZONE selected.timezone,'HH24:MI')
      WHERE id=p_appointment RETURNING * INTO appointment;
    INSERT INTO public.app_notifications(recipient_id,kind,title,body) VALUES(p_doctor,'appointment','Appointment rescheduled','A patient changed their appointment. Review your schedule.');
  END IF;
  RETURN to_jsonb(appointment);
END; $$;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK(category IN ('support','privacy_export','privacy_deletion','mfa_recovery')),
  subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 160),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID NOT NULL REFERENCES public.support_tickets(id),
  author_id UUID NOT NULL REFERENCES auth.users(id), body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_owner ON public.support_tickets(user_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.create_support_ticket(p_user UUID,p_category TEXT,p_subject TEXT,p_body TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ticket public.support_tickets;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,1));
  IF (SELECT count(*) FROM public.support_tickets WHERE user_id=p_user AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'Request limit reached'; END IF;
  INSERT INTO public.support_tickets(user_id,category,subject) VALUES(p_user,p_category,p_subject) RETURNING * INTO ticket;
  INSERT INTO public.support_messages(ticket_id,author_id,body) VALUES(ticket.id,p_user,p_body);
  INSERT INTO public.audit_events(actor_user_id,action,target_type,target_id,result) VALUES(p_user,'support_request_created','support_ticket',ticket.id::text,'ok');
  RETURN to_jsonb(ticket);
END; $$;
CREATE OR REPLACE FUNCTION public.reply_support_ticket(p_user UUID,p_ticket UUID,p_body TEXT,p_status TEXT DEFAULT NULL,p_admin BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ticket public.support_tickets;
BEGIN
  SELECT * INTO ticket FROM public.support_tickets WHERE id=p_ticket FOR UPDATE;
  IF NOT FOUND OR (ticket.user_id<>p_user AND NOT p_admin) OR (p_admin AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user AND role='administrator' AND role_verified AND account_status='active')) THEN
    RAISE EXCEPTION 'Request access denied' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.support_messages(ticket_id,author_id,body) VALUES(p_ticket,p_user,p_body);
  UPDATE public.support_tickets SET status=coalesce(CASE WHEN p_admin THEN p_status ELSE NULL END,status),updated_at=now() WHERE id=p_ticket RETURNING * INTO ticket;
  IF p_user<>ticket.user_id THEN INSERT INTO public.app_notifications(recipient_id,kind,title,body) VALUES(ticket.user_id,'support','Support replied to your request','Open Support to review the reply.'); END IF;
  INSERT INTO public.audit_events(actor_user_id,action,target_type,target_id,result) VALUES(p_user,'support_request_replied','support_ticket',ticket.id::text,'ok');
  RETURN to_jsonb(ticket);
END; $$;

CREATE TABLE IF NOT EXISTS public.delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipient_id UUID NOT NULL REFERENCES auth.users(id),
  channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
  kind TEXT NOT NULL DEFAULT 'notification', reference TEXT NOT NULL, due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','accepted','delivered','failed','skipped','uncertain')),
  attempt INTEGER NOT NULL DEFAULT 0, lease_until TIMESTAMPTZ, provider_id TEXT, last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recipient_id,channel,reference)
);
CREATE INDEX IF NOT EXISTS delivery_jobs_due ON public.delivery_jobs(status,due_at);
CREATE OR REPLACE FUNCTION public.enqueue_notification_delivery() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.delivery_jobs(recipient_id,channel,kind,reference)
  SELECT NEW.recipient_id,channel,NEW.kind,'notification:'||NEW.id FROM (VALUES('email'),('sms')) AS channels(channel)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notification_delivery_queue ON public.app_notifications;
CREATE TRIGGER notification_delivery_queue AFTER INSERT ON public.app_notifications FOR EACH ROW EXECUTE FUNCTION public.enqueue_notification_delivery();

CREATE OR REPLACE FUNCTION public.notify_pharmacy_patient() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.dispensing_status IN ('ready','completed') AND (TG_OP='INSERT' OR OLD.dispensing_status IS DISTINCT FROM NEW.dispensing_status) THEN
    INSERT INTO public.app_notifications(recipient_id,kind,title,body) VALUES(NEW.patient_user_id,'pharmacy',
      CASE WHEN NEW.dispensing_status='ready' THEN 'Prescription ready for pickup' ELSE 'Prescription pickup recorded' END,
      'Your pharmacy updated your prescription. Open your workspace to review the update.');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS pharmacy_patient_notification ON public.pharmacy_prescription_events;
CREATE TRIGGER pharmacy_patient_notification AFTER INSERT OR UPDATE OF dispensing_status ON public.pharmacy_prescription_events FOR EACH ROW EXECUTE FUNCTION public.notify_pharmacy_patient();
REVOKE ALL ON FUNCTION public.notify_pharmacy_patient() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.claim_delivery_jobs(p_limit INTEGER DEFAULT 20,p_channel TEXT DEFAULT NULL)
RETURNS SETOF public.delivery_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  -- An interrupted SMS request has an unknown outcome and must not be resent automatically.
  UPDATE public.delivery_jobs SET status='uncertain',last_error='Worker interrupted; check provider receipt before retrying',updated_at=now()
    WHERE status='processing' AND lease_until<now();
  RETURN QUERY WITH due AS (SELECT id FROM public.delivery_jobs WHERE status='pending' AND due_at<=now() AND (p_channel IS NULL OR channel=p_channel) ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(p_limit,50)))
    UPDATE public.delivery_jobs j SET status='processing',attempt=attempt+1,lease_until=now()+interval '5 minutes',updated_at=now()
    FROM due WHERE j.id=due.id RETURNING j.*;
END; $$;

CREATE OR REPLACE FUNCTION public.queue_appointment_reminders() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.delivery_jobs(recipient_id,channel,kind,reference,due_at)
  SELECT a.patient_id,c.channel,'appointment_reminder','appointment:'||a.id||':'||a.starts_at::text,a.starts_at-interval '24 hours'
  FROM public.appointments a CROSS JOIN (VALUES('email'),('sms')) AS c(channel)
  WHERE a.status='upcoming' AND a.starts_at>now() AND a.starts_at<=now()+interval '25 hours'
  ON CONFLICT DO NOTHING;
END; $$;

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['doctor_schedules','appointment_slots','support_tickets','support_messages','delivery_jobs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',table_name);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO service_role',table_name);
  END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.manage_doctor_slot(UUID,UUID,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID),public.book_appointment_slot(UUID,UUID,UUID,TEXT,TEXT,UUID),public.claim_delivery_jobs(INTEGER,TEXT),public.queue_appointment_reminders(),public.enqueue_notification_delivery() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_support_ticket(UUID,TEXT,TEXT,TEXT),public.reply_support_ticket(UUID,UUID,TEXT,TEXT,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(UUID,TEXT,TEXT,TEXT),public.reply_support_ticket(UUID,UUID,TEXT,TEXT,BOOLEAN) TO service_role;
REVOKE ALL ON FUNCTION public.release_lab_report(UUID,UUID,UUID),public.decide_access_request(BIGINT,UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_lab_report(UUID,UUID,UUID),public.decide_access_request(BIGINT,UUID,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.manage_doctor_slot(UUID,UUID,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,UUID),public.book_appointment_slot(UUID,UUID,UUID,TEXT,TEXT,UUID),public.claim_delivery_jobs(INTEGER,TEXT),public.queue_appointment_reminders() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
