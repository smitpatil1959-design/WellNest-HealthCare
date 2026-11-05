-- Read-only. Each of the five functions should be present exactly once.
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,
  position(quote_literal('40001') IN p.prosrc)>0 AS uses_retryable_business_code,
  position(quote_literal('PT409') IN p.prosrc)>0 AS uses_http_conflict_code
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
  ('save_hospital_entry','release_lab_report','decide_access_request','manage_doctor_slot','book_appointment_slot')
ORDER BY p.proname;

-- Inspect only aged calls to the affected RPCs; do not print query bodies.
SELECT pid,state,clock_timestamp()-query_start AS elapsed,
  CASE WHEN query LIKE '%book_appointment_slot%' THEN 'book_appointment_slot'
       WHEN query LIKE '%manage_doctor_slot%' THEN 'manage_doctor_slot'
       WHEN query LIKE '%save_hospital_entry%' THEN 'save_hospital_entry'
       WHEN query LIKE '%release_lab_report%' THEN 'release_lab_report'
       ELSE 'decide_access_request' END AS workflow
FROM pg_stat_activity
WHERE pid<>pg_backend_pid() AND usename='authenticator' AND state='active'
AND query_start<clock_timestamp()-interval '90 seconds'
AND query ~ '(book_appointment_slot|manage_doctor_slot|save_hospital_entry|release_lab_report|decide_access_request)';
