-- Read-only production schema audit for the Supabase SQL Editor.
-- Run against the intended production project after selecting it in the dashboard.
-- This script reports database objects; it does not apply migrations or read patient rows.

-- 1. Confirm the connected database context. Do not use a local .env file as proof.
SELECT current_database() AS database_name, current_user AS database_role,
       current_setting('server_version') AS postgres_version;

-- 2. Check required tables and whether row-level security is enabled/forced.
WITH required(table_name) AS (
  VALUES ('profiles'), ('health_identities'), ('records'), ('prescriptions'),
         ('appointments'), ('lab_reports'), ('medications'), ('vaccinations'),
         ('insurance_plans'), ('access_grants'), ('access_requests'),
         ('notification_preferences'), ('health_audit_logs'), ('record_shares'),
         ('app_notifications')
)
SELECT required.table_name,
       relation.oid IS NOT NULL AS exists,
       COALESCE(relation.relrowsecurity, false) AS rls_enabled,
       COALESCE(relation.relforcerowsecurity, false) AS rls_forced
FROM required
LEFT JOIN pg_namespace schema ON schema.nspname = 'public'
LEFT JOIN pg_class relation
  ON relation.relnamespace = schema.oid
 AND relation.relname = required.table_name
 AND relation.relkind IN ('r', 'p')
ORDER BY required.table_name;

-- 3. Inspect columns and defaults used by application queries and policies.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'health_identities', 'records', 'prescriptions', 'appointments',
    'lab_reports', 'medications', 'vaccinations', 'insurance_plans', 'access_grants',
    'access_requests', 'notification_preferences', 'health_audit_logs',
    'record_shares', 'app_notifications'
  )
ORDER BY table_name, ordinal_position;

-- 4. Inspect table constraints and indexes (including uniqueness and foreign keys).
SELECT table_name, object_name, definition
FROM (
  SELECT relation.relname AS table_name, constraint_row.conname AS object_name,
         pg_get_constraintdef(constraint_row.oid) AS definition
  FROM pg_constraint constraint_row
  JOIN pg_class relation ON relation.oid = constraint_row.conrelid
  JOIN pg_namespace schema ON schema.oid = relation.relnamespace
  WHERE schema.nspname = 'public'
    AND relation.relname IN ('profiles', 'health_identities', 'records', 'prescriptions',
      'appointments', 'lab_reports', 'medications', 'vaccinations', 'insurance_plans',
      'access_grants', 'access_requests', 'notification_preferences', 'health_audit_logs',
      'record_shares', 'app_notifications')
  UNION ALL
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'health_identities', 'records', 'prescriptions',
      'appointments', 'lab_reports', 'medications', 'vaccinations', 'insurance_plans',
      'access_grants', 'access_requests', 'notification_preferences', 'health_audit_logs',
      'record_shares', 'app_notifications')
) objects
ORDER BY table_name, object_name;

-- 5. Inspect all policies on the application tables. Confirm there are no
-- unexpected permissive policies that broaden access beyond these definitions.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'health_identities', 'records', 'prescriptions',
    'appointments', 'lab_reports', 'medications', 'vaccinations', 'insurance_plans',
    'access_grants', 'access_requests', 'notification_preferences', 'health_audit_logs',
    'record_shares', 'app_notifications')
ORDER BY tablename, policyname;

-- 6. Inspect direct grants to browser roles on application tables.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND table_name IN ('profiles', 'health_identities', 'records', 'prescriptions',
    'appointments', 'lab_reports', 'medications', 'vaccinations', 'insurance_plans',
    'access_grants', 'access_requests', 'notification_preferences', 'health_audit_logs',
    'record_shares', 'app_notifications')
ORDER BY table_name, grantee, privilege_type;

-- 7. Inspect security-sensitive function bodies, definer status and configured search path.
SELECT procedure.proname AS function_name, procedure.prosecdef AS security_definer,
       procedure.proconfig AS function_settings,
       pg_get_functiondef(procedure.oid) AS function_definition
FROM pg_proc procedure
JOIN pg_namespace schema ON schema.oid = procedure.pronamespace
WHERE schema.nspname = 'public'
  AND procedure.proname IN ('handle_new_user', 'notify_access_request_created',
    'notify_access_request_decided', 'notify_appointment_change',
    'notify_prescription_created', 'notify_lab_report_released')
ORDER BY procedure.proname;

-- 8. Inspect attached triggers.
SELECT relation.relname AS table_name, trigger_row.tgname AS trigger_name,
       pg_get_triggerdef(trigger_row.oid, true) AS trigger_definition
FROM pg_trigger trigger_row
JOIN pg_class relation ON relation.oid = trigger_row.tgrelid
JOIN pg_namespace schema ON schema.oid = relation.relnamespace
WHERE NOT trigger_row.tgisinternal
  AND schema.nspname = 'public'
  AND trigger_row.tgname IN ('on_auth_user_created', 'app_notify_access_request_created',
    'app_notify_access_request_decided', 'app_notify_appointment_change',
    'app_notify_prescription_created', 'app_notify_lab_report_released')
ORDER BY relation.relname, trigger_row.tgname;

-- 9. Check whether Supabase migration history is available. If this returns a
-- non-NULL relation, separately run:
-- SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history_table;
