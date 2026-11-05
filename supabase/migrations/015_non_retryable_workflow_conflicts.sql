-- Apply after 014. Preserve function bodies, signatures, privileges and locking.
-- Business conflicts must NOT use serialization_failure (40001): affected
-- PostgREST versions retry that code indefinitely. PT409 returns HTTP 409.
-- No patient rows, roles, grants or stored files are changed.
BEGIN;
DO $$
DECLARE routine RECORD; definition TEXT; found_count INTEGER := 0;
BEGIN
  FOR routine IN
    SELECT p.oid,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN
      ('save_hospital_entry','release_lab_report','decide_access_request','manage_doctor_slot','book_appointment_slot')
  LOOP
    found_count := found_count + 1;
    definition := pg_get_functiondef(routine.oid);
    EXECUTE replace(definition, quote_literal('40001'), quote_literal('PT409'));
  END LOOP;
  IF found_count <> 5 THEN
    RAISE EXCEPTION 'Expected exactly five workflow functions; found %. No changes committed.',found_count;
  END IF;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
