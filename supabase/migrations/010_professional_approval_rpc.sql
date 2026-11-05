-- Forward-only transactional professional approval RPC.
-- Migration: 010_professional_approval_rpc.sql
-- Atomically validates and provisions professional staff accounts with verified organization memberships.
-- Apply only after migrations 005, 006, 007, 008, 009 have been applied.

CREATE OR REPLACE FUNCTION public.approve_professional_applicant(
  p_applicant_user_id UUID,
  p_target_organization_id UUID,
  p_acting_admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_verified BOOLEAN;
  v_applicant_profile RECORD;
  v_user_meta_role TEXT;
  v_requested_role TEXT;
  v_target_org RECORD;
  v_membership_role TEXT;
  v_membership_id UUID;
BEGIN
  -- 1. Input sanity check
  IF p_applicant_user_id IS NULL OR p_target_organization_id IS NULL OR p_acting_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Applicant ID, target organization ID, and acting administrator ID are required';
  END IF;

  -- 2. Prevent self-approval (no user can approve their own account)
  IF p_applicant_user_id = p_acting_admin_user_id THEN
    RAISE EXCEPTION 'Administrator cannot approve their own account';
  END IF;

  -- 3. Validate acting administrator identity from trusted profile state
  -- Never trusts browser role, localStorage, URL, or metadata.
  SELECT role, role_verified
  INTO v_admin_role, v_admin_verified
  FROM public.profiles
  WHERE id = p_acting_admin_user_id;

  IF NOT FOUND OR v_admin_role <> 'administrator' OR v_admin_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Acting user is not an authorized verified administrator';
  END IF;

  -- 4. Lock and validate applicant profile row to prevent concurrent approval races
  SELECT id, role, role_verified, organization_id, full_name
  INTO v_applicant_profile
  FROM public.profiles
  WHERE id = p_applicant_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Applicant profile not found';
  END IF;

  -- Applicant must not already be a verified professional
  IF v_applicant_profile.role_verified IS TRUE THEN
    RAISE EXCEPTION 'Applicant is already verified';
  END IF;

  -- 5. Derive requested professional role from trusted server auth state
  -- Checks auth.users.raw_user_meta_data ->> 'requested_role' first,
  -- then falls back to profiles.role if it was provisioned with an unverified professional role.
  SELECT raw_user_meta_data ->> 'requested_role'
  INTO v_user_meta_role
  FROM auth.users
  WHERE id = p_applicant_user_id;

  v_requested_role := COALESCE(
    NULLIF(v_user_meta_role, ''),
    CASE
      WHEN v_applicant_profile.role IN ('doctor', 'laboratory', 'hospital', 'pharmacy', 'insurance')
      THEN v_applicant_profile.role
      ELSE NULL
    END
  );

  IF v_requested_role IS NULL OR v_requested_role NOT IN ('doctor', 'laboratory', 'hospital', 'pharmacy', 'insurance') THEN
    RAISE EXCEPTION 'Applicant has no valid requested professional role (found: %)', COALESCE(v_requested_role, 'none');
  END IF;

  -- 6. Check for conflicting active memberships in any organization
  IF EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = p_applicant_user_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Applicant already has an active organization membership';
  END IF;

  -- 7. Load and validate target organization
  SELECT id, kind, legal_name, display_name, status
  INTO v_target_org
  FROM public.organizations
  WHERE id = p_target_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target organization not found';
  END IF;

  IF v_target_org.status <> 'verified' THEN
    RAISE EXCEPTION 'Target organization is not verified (current status: %)', v_target_org.status;
  END IF;

  -- 8. Validate role <-> organization kind compatibility
  -- Canonical mappings:
  -- doctor      -> hospital
  -- laboratory  -> laboratory
  -- hospital    -> hospital
  -- pharmacy    -> pharmacy
  -- insurance   -> insurance
  IF v_requested_role = 'doctor' AND v_target_org.kind <> 'hospital' THEN
    RAISE EXCEPTION 'Doctor accounts can only be associated with hospital organizations';
  ELSIF v_requested_role = 'laboratory' AND v_target_org.kind <> 'laboratory' THEN
    RAISE EXCEPTION 'Laboratory accounts can only be associated with laboratory organizations';
  ELSIF v_requested_role = 'hospital' AND v_target_org.kind <> 'hospital' THEN
    RAISE EXCEPTION 'Hospital accounts can only be associated with hospital organizations';
  ELSIF v_requested_role = 'pharmacy' AND v_target_org.kind <> 'pharmacy' THEN
    RAISE EXCEPTION 'Pharmacy accounts can only be associated with pharmacy organizations';
  ELSIF v_requested_role = 'insurance' AND v_target_org.kind <> 'insurance' THEN
    RAISE EXCEPTION 'Insurance accounts can only be associated with insurance organizations';
  END IF;

  -- 9. Determine membership role matching organization schema constraints
  CASE v_requested_role
    WHEN 'doctor'     THEN v_membership_role := 'doctor';
    WHEN 'hospital'   THEN v_membership_role := 'hospital_admin';
    WHEN 'laboratory' THEN v_membership_role := 'laboratory_admin';
    WHEN 'pharmacy'   THEN v_membership_role := 'pharmacy_admin';
    WHEN 'insurance'  THEN v_membership_role := 'insurance_admin';
  END CASE;

  -- 10. Update applicant profile atomically
  UPDATE public.profiles
  SET
    role = v_requested_role,
    role_verified = true,
    organization_id = v_target_org.id,
    organization = v_target_org.display_name,
    updated_at = now()
  WHERE id = p_applicant_user_id;

  -- 11. Create or activate organization membership
  INSERT INTO public.organization_memberships (
    organization_id,
    user_id,
    role,
    status,
    verified_at,
    verified_by,
    created_at,
    updated_at
  )
  VALUES (
    v_target_org.id,
    p_applicant_user_id,
    v_membership_role,
    'active',
    now(),
    p_acting_admin_user_id,
    now(),
    now()
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    status = 'active',
    verified_at = EXCLUDED.verified_at,
    verified_by = EXCLUDED.verified_by,
    updated_at = now()
  RETURNING id INTO v_membership_id;

  -- 12. Write audit event record
  INSERT INTO public.audit_events (
    actor_user_id,
    organization_id,
    action,
    target_type,
    target_id,
    result,
    metadata,
    created_at
  )
  VALUES (
    p_acting_admin_user_id,
    v_target_org.id,
    'professional_applicant_approved',
    'user',
    p_applicant_user_id::text,
    'ok',
    jsonb_build_object(
      'applicant_user_id', p_applicant_user_id,
      'role', v_requested_role,
      'membership_role', v_membership_role,
      'organization_id', v_target_org.id,
      'organization_kind', v_target_org.kind,
      'membership_id', v_membership_id
    ),
    now()
  );

  -- 13. Create app notification for the approved professional
  INSERT INTO public.app_notifications (
    recipient_id,
    kind,
    title,
    body,
    created_at
  )
  VALUES (
    p_applicant_user_id,
    'account_verified',
    'Professional verification approved',
    'Your professional credentials have been approved for ' || v_target_org.display_name || '.',
    now()
  );

  -- 14. Return success result
  RETURN jsonb_build_object(
    'success', true,
    'applicant_user_id', p_applicant_user_id,
    'organization_id', v_target_org.id,
    'role', v_requested_role,
    'membership_role', v_membership_role,
    'membership_id', v_membership_id,
    'verified_at', now()
  );
END;
$$;

-- Security hardening: revoke direct browser execution
REVOKE ALL ON FUNCTION public.approve_professional_applicant(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;

-- Allow only server-side service-role to execute this RPC
GRANT EXECUTE ON FUNCTION public.approve_professional_applicant(UUID, UUID, UUID) TO service_role;
