-- WellNest Healthcare read-only production preflight.
-- Paste into the intended Supabase SQL Editor before migrations 006-009.
-- This file contains catalog and information_schema SELECT statements only.
-- It never changes schema, data, privileges, policies, functions, or triggers.

-- ============================================================
-- 0. Connection and required migration order
-- ============================================================

SELECT current_database() AS database_name,
       current_user AS database_user,
       current_setting('server_version') AS postgres_version;

SELECT oid, nspname
FROM pg_catalog.pg_namespace
WHERE nspname IN ('public', 'auth', 'supabase_migrations');

SELECT ordinal_position, migration_name
FROM (VALUES
  (1, '005_reconcile_production_schema'),
  (2, '006_organization_foundation'),
  (3, '007_laboratory_foundation'),
  (4, '008_pharmacy_prescription_events'),
  (5, '009_insurance_claims')
) AS expected(ordinal_position, migration_name)
ORDER BY ordinal_position;

SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history_table;

-- Run separately when the migration history relation exists:
-- SELECT version, name
-- FROM supabase_migrations.schema_migrations
-- WHERE name IN (
--   '005_reconcile_production_schema',
--   '006_organization_foundation',
--   '007_laboratory_foundation',
--   '008_pharmacy_prescription_events',
--   '009_insurance_claims'
-- )
-- ORDER BY version;

-- ============================================================
-- 1. Migration 005 baseline tables and columns
-- ============================================================

WITH required(table_name) AS (
  VALUES
    ('profiles'), ('access_requests'), ('access_grants'),
    ('app_notifications'), ('health_audit_logs'), ('record_shares'),
    ('health_identities')
)
SELECT required.table_name,
       to_regclass('public.' || required.table_name) IS NOT NULL AS exists,
       COALESCE(cls.relrowsecurity, false) AS rls_enabled,
       COALESCE(cls.relforcerowsecurity, false) AS rls_forced
FROM required
LEFT JOIN pg_class cls
  ON cls.oid = to_regclass('public.' || required.table_name)
ORDER BY required.table_name;

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'access_requests', 'access_grants')
ORDER BY table_name, ordinal_position;

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name IN (
      'role_verified', 'organization_id', 'date_of_birth', 'gender', 'address',
      'license_number', 'professional_title', 'specialty', 'onboarding_completed'
    ))
    OR (table_name = 'access_requests' AND column_name IN (
      'health_id', 'patient_name', 'requester_id', 'requester_role', 'decided_at'
    ))
    OR (table_name = 'access_grants' AND column_name IN (
      'request_id', 'patient_user_id', 'patient_name', 'requester_id',
      'requester_role', 'revoked_at'
    ))
  )
ORDER BY table_name, column_name;

-- Baseline object and trigger/function state.
SELECT routine_schema, routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'notify_access_request_created',
    'notify_access_request_decided',
    'notify_appointment_change',
    'notify_prescription_created',
    'notify_lab_report_released'
  )
ORDER BY routine_name;

SELECT n.nspname AS routine_schema,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS argument_signature,
       owner.rolname AS owner_name,
       p.prosecdef AS security_definer,
       p.proconfig AS function_config,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles owner ON owner.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'notify_access_request_created',
    'notify_access_request_decided',
    'notify_appointment_change',
    'notify_prescription_created',
    'notify_lab_report_released'
  )
ORDER BY p.proname, argument_signature;

SELECT event_object_schema,
       event_object_table,
       trigger_name,
       action_timing,
       event_manipulation,
       action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (
    trigger_name LIKE '%access%'
    OR trigger_name LIKE '%appointment%'
    OR trigger_name LIKE '%prescription%'
    OR trigger_name LIKE '%lab%'
    OR trigger_name LIKE '%auth%'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;

-- Health identity, record share, notification, and audit policies.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'health_identities', 'record_shares', 'app_notifications', 'health_audit_logs'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- 2. Existing dependency columns
-- ============================================================

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'records' AND column_name IN ('id', 'patient_id'))
    OR (table_name = 'lab_reports' AND column_name IN ('id', 'patient_id'))
    OR (table_name = 'prescriptions' AND column_name IN ('id', 'patient_id', 'doctor_id'))
    OR (table_name = 'insurance_plans' AND column_name IN ('id', 'patient_id', 'insurer_id'))
  )
ORDER BY table_name, column_name;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS column_type,
       con.contype AS constraint_type,
       con.conname AS constraint_name,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
WHERE n.nspname = 'public'
  AND c.relname IN ('records', 'lab_reports', 'prescriptions', 'insurance_plans')
ORDER BY c.relname, a.attname, con.conname;

SELECT table_schema, table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name IN ('records', 'lab_reports', 'prescriptions', 'insurance_plans')
ORDER BY table_name, constraint_name;

SELECT table_schema, table_name, column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';

-- ============================================================
-- 3. Migration 006 preflight
-- ============================================================

WITH expected(table_name) AS (
  VALUES ('organizations'), ('organization_memberships'),
         ('organization_documents'), ('audit_events')
), actual AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT expected.table_name,
       CASE
         WHEN actual.table_name IS NULL THEN 'ABSENT'
         ELSE 'PRESENT - inspect columns and constraints below'
       END AS state,
       COALESCE(cls.relrowsecurity, false) AS rls_enabled,
       COALESCE(cls.relforcerowsecurity, false) AS rls_forced
FROM expected
LEFT JOIN actual ON actual.table_name = expected.table_name
LEFT JOIN pg_class cls ON cls.oid = to_regclass('public.' || expected.table_name)
ORDER BY expected.table_name;

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'organization_memberships', 'organization_documents', 'audit_events')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('organizations', 'organization_memberships', 'organization_documents', 'audit_events')
ORDER BY c.relname, con.conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'organization_memberships', 'organization_documents', 'audit_events')
ORDER BY tablename, indexname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'organization_memberships', 'organization_documents', 'audit_events')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY table_name, grantee, privilege_type;

SELECT table_name,
       CASE
         WHEN bool_or(column_name = 'storage_object_id') THEN 'storage_object_id present'
         WHEN bool_or(column_name = 'object_key') THEN 'LEGACY object_key present'
         ELSE 'storage reference absent'
       END AS storage_reference_state
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organization_documents'
GROUP BY table_name;

-- ============================================================
-- 4. Migration 007 preflight
-- ============================================================

WITH expected(table_name) AS (
  VALUES ('storage_objects'), ('lab_orders'), ('lab_report_versions')
), actual AS (
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
)
SELECT expected.table_name,
       CASE WHEN actual.table_name IS NULL THEN 'ABSENT' ELSE 'PRESENT - inspect below' END AS state,
       COALESCE(cls.relrowsecurity, false) AS rls_enabled,
       COALESCE(cls.relforcerowsecurity, false) AS rls_forced
FROM expected
LEFT JOIN actual ON actual.table_name = expected.table_name
LEFT JOIN pg_class cls ON cls.oid = to_regclass('public.' || expected.table_name)
ORDER BY expected.table_name;

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('storage_objects', 'lab_orders', 'lab_report_versions')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('storage_objects', 'lab_orders', 'lab_report_versions')
ORDER BY c.relname, con.conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('storage_objects', 'lab_orders', 'lab_report_versions')
ORDER BY tablename, indexname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('storage_objects', 'lab_orders', 'lab_report_versions', 'lab_reports')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- Explicit storage linkage checks.
SELECT con.conname,
       child.relname AS child_table,
       child_col.attname AS child_column,
       parent.relname AS parent_table,
       parent_col.attname AS parent_column,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class child ON child.oid = con.conrelid
JOIN pg_class parent ON parent.oid = con.confrelid
JOIN pg_attribute child_col ON child_col.attrelid = child.oid AND child_col.attnum = con.conkey[1]
JOIN pg_attribute parent_col ON parent_col.attrelid = parent.oid AND parent_col.attnum = con.confkey[1]
WHERE con.contype = 'f'
  AND child.relnamespace = 'public'::regnamespace
  AND (
    (child.relname = 'storage_objects' AND child_col.attname = 'lab_report_version_id')
    OR (child.relname = 'organization_documents' AND child_col.attname = 'storage_object_id')
  )
ORDER BY child.relname, child_col.attname;

-- ============================================================
-- 5. Migration 008 preflight
-- ============================================================

SELECT to_regclass('public.pharmacy_prescription_events') IS NOT NULL AS exists,
       COALESCE(c.relrowsecurity, false) AS rls_enabled,
       COALESCE(c.relforcerowsecurity, false) AS rls_forced
FROM (SELECT 1) AS singleton
LEFT JOIN pg_class c ON c.oid = to_regclass('public.pharmacy_prescription_events');

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pharmacy_prescription_events'
ORDER BY ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'pharmacy_prescription_events'
ORDER BY con.conname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'pharmacy_prescription_events'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY grantee, privilege_type;

-- ============================================================
-- 6. Migration 009 preflight
-- ============================================================

WITH expected(table_name) AS (
  VALUES ('insurance_claims'), ('insurance_claim_documents')
), actual AS (
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
)
SELECT expected.table_name,
       CASE WHEN actual.table_name IS NULL THEN 'ABSENT' ELSE 'PRESENT - inspect below' END AS state,
       COALESCE(cls.relrowsecurity, false) AS rls_enabled,
       COALESCE(cls.relforcerowsecurity, false) AS rls_forced
FROM expected
LEFT JOIN actual ON actual.table_name = expected.table_name
LEFT JOIN pg_class cls ON cls.oid = to_regclass('public.' || expected.table_name)
ORDER BY expected.table_name;

SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('insurance_claims', 'insurance_claim_documents')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname AS constraint_name,
       con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('insurance_claims', 'insurance_claim_documents')
ORDER BY c.relname, con.conname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('insurance_claims', 'insurance_claim_documents')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 7. Conflicting objects and unexpected browser privileges
-- ============================================================

SELECT connamespace::regnamespace AS schema_name,
       conname AS constraint_name,
       count(*) AS occurrence_count,
       string_agg(conrelid::regclass::text, ', ' ORDER BY conrelid::regclass::text) AS relations
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
GROUP BY connamespace, conname
HAVING count(*) > 1
ORDER BY conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'organization_memberships', 'organization_documents',
    'audit_events', 'storage_objects', 'lab_orders', 'lab_report_versions',
    'pharmacy_prescription_events', 'insurance_claims', 'insurance_claim_documents'
  )
ORDER BY tablename, indexname;

SELECT schemaname, tablename, policyname, count(*) AS policy_occurrences
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, policyname
HAVING count(*) > 1
ORDER BY tablename, policyname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'organizations', 'organization_memberships', 'organization_documents',
    'audit_events', 'storage_objects', 'lab_orders', 'lab_report_versions',
    'pharmacy_prescription_events', 'insurance_claims', 'insurance_claim_documents'
  )
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 8. Final classification query
-- ============================================================

WITH expected(table_name, migration_name, required_columns) AS (
  VALUES
    ('organizations', '006', ARRAY['id', 'kind', 'legal_name', 'display_name', 'status']),
    ('organization_memberships', '006', ARRAY['id', 'organization_id', 'user_id', 'role', 'status', 'verified_at']),
    ('organization_documents', '006', ARRAY['id', 'organization_id', 'document_type', 'storage_object_id', 'status']),
    ('audit_events', '006', ARRAY['id', 'actor_user_id', 'organization_id', 'action', 'target_type', 'result']),
    ('storage_objects', '007', ARRAY['id', 'bucket', 'object_key', 'organization_id', 'purpose', 'mime_type', 'byte_size', 'scan_status', 'lab_report_version_id']),
    ('lab_orders', '007', ARRAY['id', 'organization_id', 'patient_user_id', 'accession_number', 'test_kind', 'test_name', 'priority', 'status']),
    ('lab_report_versions', '007', ARRAY['id', 'lab_order_id', 'organization_id', 'patient_user_id', 'version', 'status', 'analytes', 'critical']),
    ('pharmacy_prescription_events', '008', ARRAY['id', 'prescription_id', 'organization_id', 'patient_user_id', 'verification_status', 'dispensing_status']),
    ('insurance_claims', '009', ARRAY['id', 'organization_id', 'patient_user_id', 'insurance_plan_id', 'service_type', 'amount', 'status']),
    ('insurance_claim_documents', '009', ARRAY['id', 'claim_id', 'organization_id', 'storage_object_id', 'document_type', 'source', 'verification_status'])
), present AS (
  SELECT table_name, array_agg(column_name ORDER BY column_name) AS columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name
)
SELECT expected.migration_name,
       expected.table_name,
       CASE
         WHEN present.table_name IS NULL THEN 'ABSENT'
         WHEN expected.required_columns::text[] <@ present.columns::text[] THEN 'COMPLETE/COMPATIBLE CANDIDATE'
         ELSE 'PARTIAL/DIVERGENT'
       END AS classification,
       expected.required_columns AS required_columns,
       COALESCE(present.columns, ARRAY[]::text[]) AS actual_columns
FROM expected
LEFT JOIN present ON present.table_name = expected.table_name
ORDER BY expected.migration_name, expected.table_name;
