-- ============================================================================
-- READ-ONLY PREFLIGHT VERIFICATION FOR MIGRATION 010
-- File: migration_010_preflight.sql
--
-- This script contains ONLY read-only queries (SELECT).
-- It does NOT contain INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, or TRUNCATE.
-- Run in Supabase SQL Editor or via psql to verify pre-conditions before applying 010.
-- Expected migration sequence: 005 -> 006 -> 007 -> 008 -> 009 -> 010
-- ============================================================================

-- 1. Verify existence of all prerequisite foundation tables
SELECT
  expected_table,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = expected_table
  ) THEN 'PRESENT' ELSE 'MISSING' END AS status
FROM (
  VALUES
    ('profiles'),
    ('organizations'),
    ('organization_memberships'),
    ('audit_events'),
    ('app_notifications'),
    ('records'),
    ('appointments'),
    ('prescriptions'),
    ('lab_reports'),
    ('insurance_plans'),
    ('access_requests'),
    ('access_grants')
) AS t(expected_table);

-- 2. Verify existence of auth.users table in auth schema
SELECT
  'auth.users' AS table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN 'PRESENT' ELSE 'MISSING' END AS status;

-- 3. Verify prerequisite columns on public.profiles
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'full_name', 'role', 'role_verified',
    'organization_id', 'organization', 'created_at', 'updated_at'
  )
ORDER BY ordinal_position;

-- 4. Verify prerequisite columns on public.organizations
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN (
    'id', 'kind', 'legal_name', 'display_name',
    'registration_number', 'status', 'verified_at', 'verified_by'
  )
ORDER BY ordinal_position;

-- 5. Verify prerequisite columns on public.organization_memberships
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_memberships'
  AND column_name IN (
    'id', 'organization_id', 'user_id', 'role',
    'status', 'verified_at', 'verified_by', 'created_at', 'updated_at'
  )
ORDER BY ordinal_position;

-- 6. Verify prerequisite columns on public.audit_events
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_events'
  AND column_name IN (
    'id', 'actor_user_id', 'organization_id', 'action',
    'target_type', 'target_id', 'result', 'metadata', 'created_at'
  )
ORDER BY ordinal_position;

-- 7. Verify prerequisite columns on public.app_notifications
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_notifications'
  AND column_name IN (
    'id', 'recipient_id', 'kind', 'title', 'body', 'created_at', 'read_at'
  )
ORDER BY ordinal_position;

-- 8. Verify check constraints and enum/domain values
-- Organizations kind & status constraints:
SELECT
  tc.constraint_name,
  tc.table_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('organizations', 'organization_memberships')
ORDER BY tc.table_name, tc.constraint_name;

-- 9. Verify unique constraint / index on organization_memberships (user_id, organization_id)
SELECT
  i.relname AS index_name,
  a.attname AS column_name,
  ix.indisunique AS is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'organization_memberships'
  AND ix.indisunique = true
ORDER BY i.relname, a.attnum;

-- 10. Verify function name conflict check
-- Migration 010 defines public.approve_professional_applicant(UUID, UUID, UUID)
SELECT
  p.proname AS existing_function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
  n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'approve_professional_applicant';

-- 11. Verify service_role and authenticated table privileges on target tables
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'organizations', 'organization_memberships', 'audit_events', 'app_notifications')
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee, privilege_type
ORDER BY table_name, grantee, privilege_type;

-- 12. Verify RLS status on target tables
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'organizations', 'organization_memberships', 'audit_events', 'app_notifications')
ORDER BY c.relname;

-- 13. Verify migration order readiness (confirming 005 - 009 tables are present)
SELECT
  '005_reconcile_production_schema' AS migration,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_verified')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_notifications')
       THEN 'READY' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  '006_organization_foundation' AS migration,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_memberships')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_events')
       THEN 'READY' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  '007_laboratory_foundation' AS migration,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_orders')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'storage_objects')
       THEN 'READY' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  '008_pharmacy_prescription_events' AS migration,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pharmacy_prescription_events')
       THEN 'READY' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  '009_insurance_claims' AS migration,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_claims')
       THEN 'READY' ELSE 'MISSING' END AS status;
