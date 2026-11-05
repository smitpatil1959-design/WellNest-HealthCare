-- Run AFTER 015. Cancels only active API calls to the five affected RPCs that
-- already exceed the application's 60-second request lifetime by 30 seconds.
-- Existing retry loops can survive a function change. No project restart,
-- table deletion, account change or cancellation of unrelated queries occurs.
-- A canceled unfinished transaction rolls back; retry the action from the UI.
SELECT pid,pg_cancel_backend(pid) AS canceled
FROM pg_stat_activity
WHERE pid<>pg_backend_pid() AND usename='authenticator' AND state='active'
AND query_start<clock_timestamp()-interval '90 seconds'
AND query ~ '(book_appointment_slot|manage_doctor_slot|save_hospital_entry|release_lab_report|decide_access_request)';
