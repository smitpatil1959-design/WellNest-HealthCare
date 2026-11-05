-- Read-only checks for the scheduling, support and delivery upgrade.
SELECT table_schema,table_name FROM information_schema.tables
WHERE (table_schema='auth' AND table_name='mfa_factors')
   OR (table_schema='public' AND table_name IN ('profiles','organizations','organization_memberships','appointments','storage_objects','lab_orders','lab_report_versions','lab_reports','access_requests','access_grants','audit_events','app_notifications','pharmacy_prescription_events'))
ORDER BY table_schema,table_name;
-- This query must return zero rows before the unique attachment index is added.
SELECT lab_report_version_id,count(*) AS active_attachments FROM public.storage_objects
WHERE lab_report_version_id IS NOT NULL AND deleted_at IS NULL
GROUP BY lab_report_version_id HAVING count(*)>1;
SELECT policyname,cmd FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
SELECT routine_name FROM information_schema.routines WHERE routine_schema='public'
AND routine_name IN ('save_hospital_entry','set_portal_account_status');
