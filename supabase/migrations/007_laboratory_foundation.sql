-- Forward-only laboratory workflow foundation.
-- Apply only after production schema review and private storage provisioning.

CREATE TABLE IF NOT EXISTS public.storage_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  checksum TEXT,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'quarantined', 'error')),
  scanned_at TIMESTAMPTZ,
  scanner_name TEXT,
  record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
  lab_report_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(bucket, object_key)
);

CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ordering_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accession_number TEXT NOT NULL,
  test_kind TEXT NOT NULL,
  test_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'stat', 'critical')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'pending', 'in-progress', 'resulted', 'awaiting-verify', 'published')),
  doctor_name TEXT NOT NULL DEFAULT '',
  hospital_name TEXT NOT NULL DEFAULT '',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, accession_number)
);

CREATE TABLE IF NOT EXISTS public.lab_report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting-verify', 'verified', 'published', 'superseded')),
  impression TEXT NOT NULL DEFAULT '',
  analytes JSONB NOT NULL DEFAULT '[]'::jsonb,
  critical BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,
  supersedes_id UUID REFERENCES public.lab_report_versions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lab_order_id, version)
);

CREATE INDEX IF NOT EXISTS storage_objects_org_created_idx
  ON public.storage_objects(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS storage_objects_owner_created_idx
  ON public.storage_objects(owner_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS storage_objects_lab_report_version_idx
  ON public.storage_objects(lab_report_version_id)
  WHERE lab_report_version_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lab_orders_org_status_idx
  ON public.lab_orders(organization_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS lab_orders_patient_created_idx
  ON public.lab_orders(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lab_report_versions_org_status_idx
  ON public.lab_report_versions(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS lab_report_versions_patient_created_idx
  ON public.lab_report_versions(patient_user_id, created_at DESC);

ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_report_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.storage_objects FROM anon, authenticated;
REVOKE ALL ON public.lab_orders FROM anon, authenticated;
REVOKE ALL ON public.lab_report_versions FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.storage_objects TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.lab_orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.lab_report_versions TO service_role;
GRANT SELECT, INSERT ON public.lab_reports TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storage_objects_lab_report_version_fk'
  ) THEN
    ALTER TABLE public.storage_objects
      ADD CONSTRAINT storage_objects_lab_report_version_fk
      FOREIGN KEY (lab_report_version_id)
      REFERENCES public.lab_report_versions(id)
      ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_documents_storage_object_fk'
  ) THEN
    ALTER TABLE public.organization_documents
      ADD CONSTRAINT organization_documents_storage_object_fk
      FOREIGN KEY (storage_object_id)
      REFERENCES public.storage_objects(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;
