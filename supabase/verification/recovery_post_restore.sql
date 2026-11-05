-- Read-only diagnostics for a separately restored WellNest database after 013.
-- Run on both source and restore and compare the aggregate counts privately.
-- Matching counts are necessary, but do not prove identical content or file recovery.
BEGIN TRANSACTION READ ONLY;
SELECT current_database() AS database_name,now() AS checked_at;

SELECT 'profiles' AS entity,count(*) AS row_count FROM public.profiles
UNION ALL SELECT 'auth_users',count(*) FROM auth.users
UNION ALL SELECT 'organizations',count(*) FROM public.organizations
UNION ALL SELECT 'memberships',count(*) FROM public.organization_memberships
UNION ALL SELECT 'records',count(*) FROM public.records
UNION ALL SELECT 'appointments',count(*) FROM public.appointments
UNION ALL SELECT 'appointment_slots',count(*) FROM public.appointment_slots
UNION ALL SELECT 'prescriptions',count(*) FROM public.prescriptions
UNION ALL SELECT 'lab_orders',count(*) FROM public.lab_orders
UNION ALL SELECT 'lab_report_versions',count(*) FROM public.lab_report_versions
UNION ALL SELECT 'lab_reports',count(*) FROM public.lab_reports
UNION ALL SELECT 'storage_objects_metadata_only',count(*) FROM public.storage_objects
UNION ALL SELECT 'hospital_entries',count(*) FROM public.hospital_entries
UNION ALL SELECT 'pharmacy_inventory',count(*) FROM public.pharmacy_inventory
UNION ALL SELECT 'support_tickets',count(*) FROM public.support_tickets
UNION ALL SELECT 'support_messages',count(*) FROM public.support_messages
UNION ALL SELECT 'delivery_jobs',count(*) FROM public.delivery_jobs
UNION ALL SELECT 'audit_events',count(*) FROM public.audit_events
ORDER BY entity;

-- Each conflict count should be zero. No identifiers or clinical data are emitted.
SELECT 'duplicate_clinician_bookings' AS check_name,count(*) AS conflicts FROM (
  SELECT 1 FROM public.appointments WHERE status<>'canceled' GROUP BY doctor_id,date,time HAVING count(*)>1
) conflicts
UNION ALL SELECT 'duplicate_slot_reservations',count(*) FROM (
  SELECT 1 FROM public.appointments WHERE status<>'canceled' AND slot_id IS NOT NULL GROUP BY slot_id HAVING count(*)>1
) conflicts
UNION ALL SELECT 'duplicate_active_attachments',count(*) FROM (
  SELECT 1 FROM public.storage_objects WHERE deleted_at IS NULL AND lab_report_version_id IS NOT NULL GROUP BY lab_report_version_id HAVING count(*)>1
) conflicts;

SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon',c.oid,'SELECT') AS anonymous_can_read,
  has_table_privilege('authenticated',c.oid,'SELECT') AS browser_can_read
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('support_tickets','support_messages','delivery_jobs','appointment_slots','doctor_schedules')
ORDER BY c.relname;

SELECT policyname,cmd,qual FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS browser_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('save_hospital_entry','book_appointment_slot','release_lab_report','decide_access_request','reply_support_ticket','claim_delivery_jobs')
ORDER BY p.proname;

-- These are metadata checks only. Compare actual private file bytes/hashes separately.
SELECT scan_status,count(*) AS object_count FROM public.storage_objects WHERE deleted_at IS NULL GROUP BY scan_status;
ROLLBACK;
