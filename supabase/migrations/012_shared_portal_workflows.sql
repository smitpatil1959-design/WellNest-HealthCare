-- Apply after 001-011. Additive: no patient data is seeded or removed.
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended'));

CREATE TABLE IF NOT EXISTS public.hospital_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('patients','doctors','departments','admissions','reports','labs','discharges','appointments','consults')),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hospital_entries_org_kind ON public.hospital_entries(organization_id,kind,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS hospital_active_bed ON public.hospital_entries(organization_id,(payload->>'room'),(payload->>'bed'))
  WHERE kind='admissions' AND payload->>'status' <> 'discharged';
CREATE UNIQUE INDEX IF NOT EXISTS hospital_discharge_admission ON public.hospital_entries(organization_id,(payload->>'admissionId')) WHERE kind='discharges';
CREATE UNIQUE INDEX IF NOT EXISTS hospital_chart_identity ON public.hospital_entries(organization_id,(payload->>'patientUserId')) WHERE kind='patients' AND payload->>'patientUserId' IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hospital_clinic_slot ON public.hospital_entries(organization_id,(payload->>'doctorId'),(payload->>'date'),(payload->>'time'))
  WHERE kind='appointments' AND payload->>'status' <> 'canceled';

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  sku TEXT NOT NULL, form TEXT NOT NULL DEFAULT '', strength TEXT NOT NULL DEFAULT '',
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reorder INTEGER NOT NULL DEFAULT 0 CHECK (reorder >= 0),
  expires DATE NOT NULL, lot TEXT NOT NULL,
  controlled BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id,sku,lot)
);

-- Audit writes in the same transaction as the data change.
CREATE OR REPLACE FUNCTION public.audit_portal_write() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.audit_events(actor_user_id,organization_id,action,target_type,target_id,result,metadata)
  VALUES(NEW.updated_by,NEW.organization_id,lower(TG_OP),TG_TABLE_NAME,NEW.id::text,'ok',
    jsonb_build_object('version',NEW.version));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS hospital_entry_audit ON public.hospital_entries;
CREATE TRIGGER hospital_entry_audit AFTER INSERT OR UPDATE ON public.hospital_entries FOR EACH ROW EXECUTE FUNCTION public.audit_portal_write();
DROP TRIGGER IF EXISTS inventory_audit ON public.pharmacy_inventory;
CREATE TRIGGER inventory_audit AFTER INSERT OR UPDATE ON public.pharmacy_inventory FOR EACH ROW EXECUTE FUNCTION public.audit_portal_write();

-- Uses row locking and a version check so two staff members cannot silently overwrite each other.
CREATE OR REPLACE FUNCTION public.save_hospital_entry(p_organization UUID,p_actor UUID,p_kind TEXT,p_payload JSONB,p_id UUID DEFAULT NULL,p_version INTEGER DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE saved public.hospital_entries; prior public.hospital_entries; target_patient UUID; admission UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    SELECT * INTO prior FROM public.hospital_entries WHERE id=p_id AND organization_id=p_organization AND kind=p_kind FOR UPDATE;
    IF NOT FOUND OR prior.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'Entry changed' USING ERRCODE='40001'; END IF;
    UPDATE public.hospital_entries SET payload=p_payload,version=version+1,updated_by=p_actor,updated_at=now() WHERE id=p_id RETURNING * INTO saved;
  ELSE
    INSERT INTO public.hospital_entries(organization_id,kind,payload,created_by,updated_by)
    VALUES(p_organization,p_kind,p_payload,p_actor,p_actor) RETURNING * INTO saved;
  END IF;
  IF p_kind='admissions' AND p_payload->>'status'='pending-discharge' THEN
    INSERT INTO public.hospital_entries(organization_id,kind,payload,created_by,updated_by)
    VALUES(p_organization,'discharges',jsonb_build_object('admissionId',saved.id,'patientId',p_payload->>'patientId','diagnosis','','treatment','','procedures','','medication','','followUp','','instructions','','approved',false),p_actor,p_actor)
    ON CONFLICT DO NOTHING;
  END IF;
  IF p_kind='discharges' AND coalesce((p_payload->>'approved')::boolean,false) THEN
    admission := (p_payload->>'admissionId')::uuid;
    UPDATE public.hospital_entries SET payload=jsonb_set(payload,'{status}','"discharged"'::jsonb),version=version+1,updated_by=p_actor,updated_at=now()
      WHERE id=admission AND organization_id=p_organization AND kind='admissions' AND payload->>'patientId'=p_payload->>'patientId';
    IF NOT FOUND THEN RAISE EXCEPTION 'Admission not found'; END IF;
  END IF;
  -- Registration alone grants no medical-record access. The API checks current patient consent.
  IF p_payload->>'patientUserId' IS NOT NULL AND (p_kind IN ('consults','reports') OR (p_kind='discharges' AND coalesce((p_payload->>'approved')::boolean,false))) THEN
    target_patient := (p_payload->>'patientUserId')::uuid;
    IF p_kind='discharges' OR p_id IS NULL THEN
      INSERT INTO public.records(patient_id,title,category,status,hospital,doctor,summary,date)
      VALUES(target_patient,
        CASE p_kind WHEN 'consults' THEN 'Hospital consultation' WHEN 'discharges' THEN 'Hospital discharge summary' ELSE p_payload->>'title' END,
        'visit','issued',(SELECT display_name FROM public.organizations WHERE id=p_organization),
        coalesce(p_payload->>'uploader','Hospital care team'),
        CASE p_kind WHEN 'consults' THEN concat_ws(E'\n',p_payload->>'diagnosis',p_payload->>'notes',p_payload->>'rx',p_payload->>'followUp')
          WHEN 'discharges' THEN concat_ws(E'\n',p_payload->>'diagnosis',p_payload->>'treatment',p_payload->>'medication',p_payload->>'instructions',p_payload->>'followUp')
          ELSE p_payload->>'summary' END,
        coalesce(nullif(p_payload->>'date','')::date,current_date));
      INSERT INTO public.app_notifications(recipient_id,kind,title,body)
      VALUES(target_patient,'hospital_record','A hospital record is available','Your care team added a record. Open Medical Records to review it.');
    END IF;
  END IF;
  RETURN jsonb_build_object('id',saved.id,'kind',saved.kind,'payload',saved.payload,'version',saved.version,'updated_at',saved.updated_at);
END; $$;

ALTER TABLE public.hospital_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hospital_entries,public.pharmacy_inventory FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.hospital_entries,public.pharmacy_inventory TO service_role;
REVOKE ALL ON FUNCTION public.save_hospital_entry(UUID,UUID,TEXT,JSONB,UUID,INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_hospital_entry(UUID,UUID,TEXT,JSONB,UUID,INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.audit_portal_write() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.set_portal_account_status(p_actor UUID,p_target UUID,p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_actor=p_target OR p_status NOT IN ('active','suspended') OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id=p_actor AND role='administrator' AND role_verified=true AND account_status='active'
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id=p_target AND role='administrator') THEN
    RAISE EXCEPTION 'Account change denied' USING ERRCODE='42501';
  END IF;
  UPDATE public.profiles SET account_status=p_status WHERE id=p_target;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found' USING ERRCODE='42501'; END IF;
  INSERT INTO public.audit_events(actor_user_id,action,target_type,target_id,result,metadata)
  VALUES(p_actor,'account_status_changed','profile',p_target::text,'ok',jsonb_build_object('status',p_status));
END; $$;
REVOKE ALL ON FUNCTION public.set_portal_account_status(UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_portal_account_status(UUID,UUID,TEXT) TO service_role;

-- Concurrent patient bookings must not claim the same clinician slot.
-- Existing duplicate slots must be resolved before applying this index.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.appointments WHERE status <> 'canceled' GROUP BY doctor_id,date,time HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Duplicate clinician appointment slots exist. Run the read-only migration_012_preflight.sql and resolve conflicting bookings before retrying. No changes were committed.';
  END IF;
END; $$;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_doctor_active_slot ON public.appointments(doctor_id,date,time)
  WHERE status <> 'canceled';

NOTIFY pgrst, 'reload schema';
COMMIT;
