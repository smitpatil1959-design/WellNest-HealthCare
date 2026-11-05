-- DEVELOPMENT ONLY: assign verified workspace roles to already-created test
-- users after an operator has independently checked their staff credentials.
-- Run only in an isolated local/staging Supabase project, never to bypass
-- production verification. The browser cannot perform this update.
-- Replace the example UUID values before running.

BEGIN;

WITH requested_accounts(user_id, verified_role) AS (
  VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'doctor'::text),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'hospital'::text),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'laboratory'::text),
    ('00000000-0000-0000-0000-000000000004'::uuid, 'pharmacy'::text),
    ('00000000-0000-0000-0000-000000000005'::uuid, 'insurance'::text)
), approved_accounts AS (
  SELECT requested.user_id, requested.verified_role
  FROM requested_accounts requested
  JOIN auth.users account ON account.id = requested.user_id
  WHERE account.email_confirmed_at IS NOT NULL
    AND requested.verified_role IN ('doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance')
)
UPDATE public.profiles profile
SET role = approved.verified_role,
    role_verified = true,
    onboarding_completed = false,
    updated_at = now()
FROM approved_accounts approved
WHERE profile.id = approved.user_id
RETURNING profile.id, profile.role, profile.role_verified, profile.onboarding_completed;

COMMIT;
