-- Read-only. Run against the WellNest project before migration 012.
SELECT current_database() AS database_name;
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('profiles','organizations','organization_memberships','records','appointments','audit_events','app_notifications')
ORDER BY table_name;
SELECT doctor_id,date,time,count(*) AS conflicting_bookings
FROM public.appointments WHERE status <> 'canceled'
GROUP BY doctor_id,date,time HAVING count(*)>1;
-- The conflict query should return zero rows. Do not delete appointments to make it pass;
-- resolve bookings with the responsible staff if conflicts exist.
SELECT proname FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('approve_professional_applicant','save_hospital_entry','set_portal_account_status');
