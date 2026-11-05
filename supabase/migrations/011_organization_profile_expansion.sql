-- Forward-only organization profile schema expansion.
-- Migration: 011_organization_profile_expansion.sql
-- Adds operational, contact, and credentialing profile fields to public.organizations.
-- Apply only after migrations 006, 007, 008, 009, 010 have been applied.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS accreditation TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS operating_hours TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- Ensure service role permissions on public.organizations remain complete
GRANT SELECT, INSERT, UPDATE ON public.organizations TO service_role;
