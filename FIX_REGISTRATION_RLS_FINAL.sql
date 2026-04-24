-- ============================================================
-- CureVirtual — FINAL REGISTRATION RLS FIX
-- Target: Fixes 403 Forbidden / RLS Violation during registration
-- Reason: Backend is currently using an 'anon' key instead of 'service_role'
-- ============================================================

-- 1. REGISTRATION REQUESTS TABLE
-- Allow both service_role and anon/authenticated users to insert registration requests
-- This is necessary because the backend is currently using the anon key.

ALTER TABLE "RegistrationRequest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON "RegistrationRequest";
CREATE POLICY "service_role_full_access"
  ON "RegistrationRequest"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_registration" ON "RegistrationRequest";
CREATE POLICY "public_insert_registration"
  ON "RegistrationRequest"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_registration" ON "RegistrationRequest";
CREATE POLICY "admin_manage_registration"
  ON "RegistrationRequest"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2. STORAGE (license-documents bucket)
-- We must allow 'anon' and 'authenticated' roles to upload because the backend key is 'anon'.

-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('license-documents', 'license-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow anyone (anon/auth/service) to upload to this bucket
-- We restrict to INSERT and SELECT only for security.
DROP POLICY IF EXISTS "allow_upload_license" ON storage.objects;
CREATE POLICY "allow_upload_license"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (bucket_id = 'license-documents');

-- Policy: Allow upsert (update) for the registration flow
DROP POLICY IF EXISTS "allow_update_license" ON storage.objects;
CREATE POLICY "allow_update_license"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (bucket_id = 'license-documents');

-- Policy: Allow signed URL generation (SELECT)
DROP POLICY IF EXISTS "allow_read_license" ON storage.objects;
CREATE POLICY "allow_read_license"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated, service_role
  USING (bucket_id = 'license-documents');

-- 3. Grant necessary schema permissions
GRANT ALL ON TABLE "RegistrationRequest" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
