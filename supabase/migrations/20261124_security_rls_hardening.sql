-- ============================================================================
-- Migration: Comprehensive Row-Level Security (RLS) & Storage Hardening
-- Run once in Supabase Dashboard -> SQL Editor (idempotent)
-- ============================================================================

-- Helper: true ONLY for app_metadata.role = 'admin' or verified master admin email
CREATE OR REPLACE FUNCTION public.is_scrimhub_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    auth.role() = 'authenticated'
    AND (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
      OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'syahmi3122973@gmail.com'
    );
$$;

-- 1. FEEDBACKS: Public can submit, ONLY Master Admin can read/delete
ALTER TABLE IF EXISTS public.feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Master admin read feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Master admin delete feedbacks" ON public.feedbacks;

CREATE POLICY "Public insert feedbacks"
  ON public.feedbacks FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(btrim(message)) > 0 AND char_length(message) <= 2000);

CREATE POLICY "Master admin read feedbacks"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (public.is_scrimhub_master_admin());

CREATE POLICY "Master admin delete feedbacks"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (public.is_scrimhub_master_admin());

-- 2. PROFILES: Public read directory, ONLY owner (id = auth.uid()) can write
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner update profile" ON public.profiles;

CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Owner insert profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Owner update profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. TEAMS: Public read, ONLY Master Admin (or authenticated hosts for new inserts) can modify
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated insert teams" ON public.teams;
DROP POLICY IF EXISTS "Master admin update teams" ON public.teams;
DROP POLICY IF EXISTS "Master admin delete teams" ON public.teams;

CREATE POLICY "Public read teams"
  ON public.teams FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated insert teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Master admin update teams"
  ON public.teams FOR UPDATE TO authenticated
  USING (public.is_scrimhub_master_admin())
  WITH CHECK (public.is_scrimhub_master_admin());

CREATE POLICY "Master admin delete teams"
  ON public.teams FOR DELETE TO authenticated
  USING (public.is_scrimhub_master_admin());

-- 4. POSTS: Public read, Authenticated insert owned row, Owner/Admin update & delete
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated insert posts" ON public.posts;
DROP POLICY IF EXISTS "Owner or admin update posts" ON public.posts;
DROP POLICY IF EXISTS "Owner or admin delete posts" ON public.posts;

CREATE POLICY "Public read posts"
  ON public.posts FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated insert posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Owner or admin update posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (created_by = auth.uid()::text OR public.is_scrimhub_master_admin())
  WITH CHECK (created_by = auth.uid()::text OR public.is_scrimhub_master_admin());

CREATE POLICY "Owner or admin delete posts"
  ON public.posts FOR DELETE TO authenticated
  USING (created_by = auth.uid()::text OR public.is_scrimhub_master_admin());

-- 5. SCRIMS: Public read, Authenticated create, STRICT Owner/Co-Host/Admin update & delete
ALTER TABLE IF EXISTS public.scrims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read scrims" ON public.scrims;
DROP POLICY IF EXISTS "Authenticated insert scrims" ON public.scrims;
DROP POLICY IF EXISTS "Authorized host update scrims" ON public.scrims;
DROP POLICY IF EXISTS "Authorized host delete scrims" ON public.scrims;

CREATE POLICY "Public read scrims"
  ON public.scrims FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated insert scrims"
  ON public.scrims FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Authorized host update scrims"
  ON public.scrims FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()::text
    OR auth.uid()::text = ANY (COALESCE(co_hosts, ARRAY[]::text[]))
    OR public.is_scrimhub_master_admin()
  )
  WITH CHECK (
    created_by = auth.uid()::text
    OR auth.uid()::text = ANY (COALESCE(co_hosts, ARRAY[]::text[]))
    OR public.is_scrimhub_master_admin()
  );

CREATE POLICY "Authorized host delete scrims"
  ON public.scrims FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()::text
    OR public.is_scrimhub_master_admin()
  );

-- 6. STORAGE (scrim-assets): Public read images/videos, authenticated upload only (blocks SVG/HTML)
DROP POLICY IF EXISTS "Public read scrim-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload scrim-assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete scrim-assets" ON storage.objects;

CREATE POLICY "Public read scrim-assets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'scrim-assets');

CREATE POLICY "Authenticated upload scrim-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scrim-assets'
    AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm')
  );

CREATE POLICY "Owner delete scrim-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'scrim-assets'
    AND (owner = auth.uid() OR public.is_scrimhub_master_admin())
  );
