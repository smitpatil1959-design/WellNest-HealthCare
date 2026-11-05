-- ============================================================
-- WellNest Health - Core Database Schema
-- Migration: 001_core_tables
-- Run in Supabase SQL Editor or via supabase CLI
-- ============================================================

-- ----------------------------------------------------------------
-- PHASE 1: CREATE ALL TABLES (no cross-references yet)
-- ----------------------------------------------------------------

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id                         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                      TEXT,
  full_name                  TEXT,
  role                       TEXT NOT NULL DEFAULT 'patient',
  organization               TEXT DEFAULT '',
  phone                      TEXT DEFAULT '',
  language                   TEXT DEFAULT 'en',
  avatar_url                 TEXT DEFAULT '',
  blood_group                TEXT DEFAULT '',
  allergies                  TEXT[] DEFAULT '{}',
  conditions                 TEXT[] DEFAULT '{}',
  medications_list           TEXT[] DEFAULT '{}',
  emergency_contact_name     TEXT DEFAULT '',
  emergency_contact_relation TEXT DEFAULT '',
  emergency_contact_phone    TEXT DEFAULT '',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. HEALTH IDENTITIES
CREATE TABLE IF NOT EXISTS public.health_identities (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_id    TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  city         TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS health_identities_user_id_idx
  ON public.health_identities(user_id);

-- 3. RECORDS
CREATE TABLE IF NOT EXISTS public.records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'upload',
  status     TEXT NOT NULL DEFAULT 'pending',
  hospital   TEXT DEFAULT '',
  doctor     TEXT DEFAULT '',
  laboratory TEXT DEFAULT '',
  summary    TEXT DEFAULT '',
  file_url   TEXT DEFAULT '',
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id    UUID REFERENCES auth.users(id),
  medicine     TEXT NOT NULL,
  dosage       TEXT NOT NULL,
  duration     TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  refills_left INT NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  issued       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id  UUID REFERENCES auth.users(id),
  title      TEXT NOT NULL,
  reason     TEXT DEFAULT '',
  hospital   TEXT DEFAULT '',
  doctor     TEXT DEFAULT '',
  date       DATE NOT NULL,
  time       TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. LAB REPORTS
CREATE TABLE IF NOT EXISTS public.lab_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_user_id  UUID REFERENCES auth.users(id),
  test_name    TEXT NOT NULL,
  result       TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'pending',
  file_url     TEXT DEFAULT '',
  collected_at TIMESTAMPTZ,
  released_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. MEDICATIONS
CREATE TABLE IF NOT EXISTS public.medications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  dosage     TEXT NOT NULL,
  time       TEXT NOT NULL,
  taken      BOOLEAN NOT NULL DEFAULT false,
  taken_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. VACCINATIONS
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaccine_name    TEXT NOT NULL,
  doses_given     INT NOT NULL DEFAULT 1,
  administered_at TIMESTAMPTZ NOT NULL,
  next_due_at     TIMESTAMPTZ,
  provider        TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. INSURANCE PLANS
CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insurer_id     UUID REFERENCES auth.users(id),
  plan_name      TEXT NOT NULL,
  policy_number  TEXT NOT NULL,
  coverage_type  TEXT DEFAULT '',
  coverage_limit NUMERIC DEFAULT 0,
  deductible     NUMERIC DEFAULT 0,
  valid_from     DATE,
  valid_to       DATE,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ACCESS GRANTS (patient -> provider consent)
CREATE TABLE IF NOT EXISTS public.access_grants (
  id             BIGSERIAL PRIMARY KEY,
  health_id      TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  organization   TEXT DEFAULT '',
  categories     TEXT DEFAULT 'all',
  status         TEXT NOT NULL DEFAULT 'active',
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. ACCESS REQUESTS (provider -> patient, pending approval)
CREATE TABLE IF NOT EXISTS public.access_requests (
  id              BIGSERIAL PRIMARY KEY,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name  TEXT NOT NULL,
  organization    TEXT DEFAULT '',
  purpose         TEXT DEFAULT '',
  categories      TEXT DEFAULT 'all',
  duration_hours  INT NOT NULL DEFAULT 24,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      BOOLEAN NOT NULL DEFAULT true,
  sms        BOOLEAN NOT NULL DEFAULT false,
  product    BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- PHASE 2: ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_identities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- PHASE 3: CREATE ALL POLICIES
-- (all tables exist at this point, so cross-references are safe)
-- ----------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "profiles: own row" ON public.profiles;
CREATE POLICY "profiles: own row"
  ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- health_identities
DROP POLICY IF EXISTS "health_identities: own row" ON public.health_identities;
CREATE POLICY "health_identities: own row"
  ON public.health_identities FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_identities: public read" ON public.health_identities;
CREATE POLICY "health_identities: public read"
  ON public.health_identities FOR SELECT
  USING (true);

-- records: own data
DROP POLICY IF EXISTS "records: patient owns" ON public.records;
CREATE POLICY "records: patient owns"
  ON public.records FOR ALL
  USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- records: provider with active access grant can read
-- (safe now because access_grants and health_identities both exist)
DROP POLICY IF EXISTS "records: provider read with grant" ON public.records;
CREATE POLICY "records: provider read with grant"
  ON public.records FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.access_grants ag
      JOIN public.health_identities hi ON hi.user_id = records.patient_id
      WHERE ag.health_id = hi.health_id
        AND ag.status = 'active'
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
    )
  );

-- prescriptions
DROP POLICY IF EXISTS "prescriptions: patient read" ON public.prescriptions;
CREATE POLICY "prescriptions: patient read"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "prescriptions: doctor write" ON public.prescriptions;
CREATE POLICY "prescriptions: doctor write"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- appointments
DROP POLICY IF EXISTS "appointments: patient access" ON public.appointments;
CREATE POLICY "appointments: patient access"
  ON public.appointments FOR ALL
  USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "appointments: doctor access" ON public.appointments;
CREATE POLICY "appointments: doctor access"
  ON public.appointments FOR ALL
  USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- lab_reports
DROP POLICY IF EXISTS "lab_reports: patient read" ON public.lab_reports;
CREATE POLICY "lab_reports: patient read"
  ON public.lab_reports FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "lab_reports: lab write" ON public.lab_reports;
CREATE POLICY "lab_reports: lab write"
  ON public.lab_reports FOR INSERT
  WITH CHECK (auth.uid() = lab_user_id);

DROP POLICY IF EXISTS "lab_reports: lab update" ON public.lab_reports;
CREATE POLICY "lab_reports: lab update"
  ON public.lab_reports FOR UPDATE
  USING (auth.uid() = lab_user_id);

-- medications
DROP POLICY IF EXISTS "medications: patient access" ON public.medications;
CREATE POLICY "medications: patient access"
  ON public.medications FOR ALL
  USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- vaccinations
DROP POLICY IF EXISTS "vaccinations: patient read" ON public.vaccinations;
CREATE POLICY "vaccinations: patient read"
  ON public.vaccinations FOR SELECT
  USING (auth.uid() = patient_id);

-- insurance_plans
DROP POLICY IF EXISTS "insurance_plans: patient read" ON public.insurance_plans;
CREATE POLICY "insurance_plans: patient read"
  ON public.insurance_plans FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "insurance_plans: insurer write" ON public.insurance_plans;
CREATE POLICY "insurance_plans: insurer write"
  ON public.insurance_plans FOR ALL
  USING (auth.uid() = insurer_id) WITH CHECK (auth.uid() = insurer_id);

-- access_grants
DROP POLICY IF EXISTS "access_grants: patient read" ON public.access_grants;
CREATE POLICY "access_grants: patient read"
  ON public.access_grants FOR SELECT
  USING (
    health_id IN (
      SELECT health_id FROM public.health_identities WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "access_grants: patient update" ON public.access_grants;
CREATE POLICY "access_grants: patient update"
  ON public.access_grants FOR UPDATE
  USING (
    health_id IN (
      SELECT health_id FROM public.health_identities WHERE user_id = auth.uid()
    )
  );

-- access_requests
DROP POLICY IF EXISTS "access_requests: patient access" ON public.access_requests;
CREATE POLICY "access_requests: patient access"
  ON public.access_requests FOR ALL
  USING (auth.uid() = patient_user_id) WITH CHECK (auth.uid() = patient_user_id);

-- notification_preferences
DROP POLICY IF EXISTS "notification_preferences: own row" ON public.notification_preferences;
CREATE POLICY "notification_preferences: own row"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- PHASE 4: TRIGGER - auto-create profile on signup
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
