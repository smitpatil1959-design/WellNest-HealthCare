-- Security hardening for healthcare data APIs.
-- Apply after 001_core_tables.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS professional_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- The new column defaults existing profiles to unverified. Do not reset an
-- administrator's later verification if this migration is retried.

-- Align consent tables with the fields used by the API.
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS health_id TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_role TEXT NOT NULL DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

ALTER TABLE public.access_grants
  ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES public.access_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_role TEXT NOT NULL DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.health_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  health_id TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_audit_logs: no direct client access" ON public.health_audit_logs;
CREATE POLICY "health_audit_logs: no direct client access"
  ON public.health_audit_logs FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Browser clients can read their own profile. All profile writes are mediated
-- by the authenticated server API, which validates onboarding fields; database
-- roles and verification fields remain server controlled.
DROP POLICY IF EXISTS "profiles: own row" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
CREATE POLICY "profiles: own read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE INSERT (id, email, full_name, organization, phone, language, avatar_url)
  ON public.profiles FROM anon, authenticated;
REVOKE UPDATE (email, full_name, organization, phone, language, avatar_url,
  blood_group, allergies, conditions, medications_list, emergency_contact_name,
  emergency_contact_relation, emergency_contact_phone, date_of_birth, gender,
  address, license_number, professional_title, specialty, onboarding_completed, updated_at)
  ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Consent decisions and notification preferences are mediated by authenticated
-- API handlers. Do not allow browser clients to forge requests, grants, or
-- notification state through direct table writes.
REVOKE ALL ON public.access_requests, public.access_grants, public.notification_preferences
  FROM anon, authenticated;

-- Health identities are private records. The API performs authenticated,
-- audited lookups and the owner may manage their own identity directly.
DROP POLICY IF EXISTS "health_identities: public read" ON public.health_identities;
REVOKE INSERT, UPDATE, DELETE ON public.health_identities FROM anon, authenticated;
GRANT SELECT ON public.health_identities TO authenticated;
REVOKE ALL ON public.health_audit_logs FROM anon, authenticated;

-- A patient's consent must name the requesting provider, not merely exist for
-- that patient. This closes cross-provider reads through direct Supabase use.
DROP POLICY IF EXISTS "records: provider read with grant" ON public.records;
CREATE POLICY "records: provider read with grant"
  ON public.records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.user_id = records.patient_id
      WHERE ag.health_id = hi.health_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND EXISTS (
          SELECT 1 FROM public.profiles provider
          WHERE provider.id = auth.uid()
            AND provider.role_verified = true
            AND provider.role IN ('doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance')
        )
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR (records.category = 'lab' AND (lower(ag.categories) LIKE '%lab%' OR lower(ag.categories) LIKE '%report%'))
          OR (records.category = 'imaging' AND (lower(ag.categories) LIKE '%report%' OR lower(ag.categories) LIKE '%clinical history%' OR lower(ag.categories) LIKE '%treatment records%'))
          OR (records.category = 'visit' AND (lower(ag.categories) LIKE '%appointment%' OR lower(ag.categories) LIKE '%clinical history%'))
          OR (records.category = 'discharge' AND (lower(ag.categories) LIKE '%admission%' OR lower(ag.categories) LIKE '%clinical history%' OR lower(ag.categories) LIKE '%treatment records%'))
          OR (records.category = 'prescription' AND (lower(ag.categories) LIKE '%prescription%' OR lower(ag.categories) LIKE '%medication%'))
          OR (records.category = 'vaccination' AND (lower(ag.categories) LIKE '%clinical history%' OR lower(ag.categories) LIKE '%report%'))
          OR (records.category = 'upload' AND (lower(ag.categories) LIKE '%report%' OR lower(ag.categories) LIKE '%clinical history%'))
          OR (records.category NOT IN ('lab', 'imaging', 'visit', 'discharge', 'prescription', 'vaccination', 'upload') AND lower(ag.categories) LIKE '%' || lower(records.category) || '%')
        )
    )
  );

-- Enforce verified staff roles and consent in direct authenticated database
-- access as well as in the server API handlers.
DROP POLICY IF EXISTS "prescriptions: doctor write" ON public.prescriptions;
CREATE POLICY "prescriptions: doctor write"
  ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'doctor' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = prescriptions.patient_id
        AND ag.patient_user_id = prescriptions.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['prescription', 'prescriptions', 'medication', 'medications', 'authorized prescriptions', 'authorized medications'])
          )
        )
    )
  );

DROP POLICY IF EXISTS "appointments: doctor access" ON public.appointments;
CREATE POLICY "appointments: doctor access"
  ON public.appointments FOR ALL TO authenticated
  USING (
    auth.uid() = doctor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'doctor' AND provider.role_verified = true
    )
  )
  WITH CHECK (
    auth.uid() = doctor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'doctor' AND provider.role_verified = true
    )
  );

DROP POLICY IF EXISTS "lab_reports: lab write" ON public.lab_reports;
CREATE POLICY "lab_reports: lab write"
  ON public.lab_reports FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = lab_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'laboratory' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = lab_reports.patient_id
        AND ag.patient_user_id = lab_reports.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['test requests', 'lab results', 'labs', 'reports'])
          )
        )
    )
  );

DROP POLICY IF EXISTS "lab_reports: lab update" ON public.lab_reports;
CREATE POLICY "lab_reports: lab update"
  ON public.lab_reports FOR UPDATE TO authenticated
  USING (
    auth.uid() = lab_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'laboratory' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = lab_reports.patient_id
        AND ag.patient_user_id = lab_reports.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['test requests', 'lab results', 'labs', 'reports'])
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() = lab_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'laboratory' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = lab_reports.patient_id
        AND ag.patient_user_id = lab_reports.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['test requests', 'lab results', 'labs', 'reports'])
          )
        )
    )
  );

DROP POLICY IF EXISTS "insurance_plans: insurer write" ON public.insurance_plans;
CREATE POLICY "insurance_plans: insurer write"
  ON public.insurance_plans FOR ALL TO authenticated
  USING (
    auth.uid() = insurer_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'insurance' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = insurance_plans.patient_id
        AND ag.patient_user_id = insurance_plans.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['authorized claims', 'required documents', 'claims', 'documents'])
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() = insurer_id
    AND EXISTS (
      SELECT 1 FROM public.profiles provider
      WHERE provider.id = auth.uid() AND provider.role = 'insurance' AND provider.role_verified = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.health_id = ag.health_id
      WHERE hi.user_id = insurance_plans.patient_id
        AND ag.patient_user_id = insurance_plans.patient_id
        AND ag.requester_id = auth.uid()
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          lower(coalesce(ag.categories, '')) IN ('all', 'all records')
          OR EXISTS (
            SELECT 1 FROM regexp_split_to_table(coalesce(ag.categories, ''), '[,;|]') AS term(value)
            WHERE lower(btrim(term.value)) = ANY(ARRAY['authorized claims', 'required documents', 'claims', 'documents'])
          )
        )
    )
  );

-- New accounts always receive the least-privileged patient role. The role
-- requested in auth user_metadata is deliberately ignored.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, role_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'patient',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Only verified records may be issued from the database to browser clients.
CREATE INDEX IF NOT EXISTS access_requests_patient_created_idx
  ON public.access_requests(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_requests_requester_created_idx
  ON public.access_requests(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_grants_patient_created_idx
  ON public.access_grants(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_grants_requester_created_idx
  ON public.access_grants(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS health_audit_logs_health_created_idx
  ON public.health_audit_logs(health_id, created_at DESC);
