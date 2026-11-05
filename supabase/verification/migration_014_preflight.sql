-- Read-only. Confirm records and the hospital RPC exist after migration 013.
SELECT column_name,data_type,column_default FROM information_schema.columns
WHERE table_schema='public' AND table_name='records' ORDER BY ordinal_position;
SELECT proname,pg_get_function_identity_arguments(oid) AS arguments FROM pg_proc
WHERE pronamespace='public'::regnamespace AND proname='save_hospital_entry';
-- No legacy row is automatically attributed by migration 014.
