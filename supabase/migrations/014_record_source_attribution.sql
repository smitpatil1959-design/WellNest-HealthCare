-- Apply after 013. Additive attribution; no old records are reclassified or deleted.
BEGIN;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE public.records ALTER COLUMN source SET DEFAULT 'unknown';
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.records.created_by IS 'Account that created the record through a trusted application write. NULL means legacy/unattributed.';
COMMENT ON COLUMN public.records.source IS 'Application source classification. Not a cryptographic signature or clinical certification.';

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
      INSERT INTO public.records(patient_id,title,category,status,hospital,doctor,summary,date,source,created_by)
      VALUES(target_patient,
        CASE p_kind WHEN 'consults' THEN 'Hospital consultation' WHEN 'discharges' THEN 'Hospital discharge summary' ELSE p_payload->>'title' END,
        'visit','issued',(SELECT display_name FROM public.organizations WHERE id=p_organization),
        coalesce(p_payload->>'uploader','Hospital care team'),
        CASE p_kind WHEN 'consults' THEN concat_ws(E'\n',p_payload->>'diagnosis',p_payload->>'notes',p_payload->>'rx',p_payload->>'followUp')
          WHEN 'discharges' THEN concat_ws(E'\n',p_payload->>'diagnosis',p_payload->>'treatment',p_payload->>'medication',p_payload->>'instructions',p_payload->>'followUp')
          ELSE p_payload->>'summary' END,
        coalesce(nullif(p_payload->>'date','')::date,current_date),'verified',p_actor);
      INSERT INTO public.app_notifications(recipient_id,kind,title,body)
      VALUES(target_patient,'hospital_record','A hospital record is available','Your care team added a record. Open Medical Records to review it.');
    END IF;
  END IF;
  RETURN jsonb_build_object('id',saved.id,'kind',saved.kind,'payload',saved.payload,'version',saved.version,'updated_at',saved.updated_at);
END; $$;

REVOKE ALL ON FUNCTION public.save_hospital_entry(UUID,UUID,TEXT,JSONB,UUID,INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_hospital_entry(UUID,UUID,TEXT,JSONB,UUID,INTEGER) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
