-- Portal Tournament Admin Access Control
-- Only syahmi3122973@gmail.com (Master Admin) and users approved in portal_admin_approvals
-- can access Urus and open/manage tournaments inside Portal Tournament.

CREATE TABLE IF NOT EXISTS public.portal_admin_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE,
  user_email text NOT NULL UNIQUE,
  display_name text,
  note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_admin_approvals_email_lower
  ON public.portal_admin_approvals ((lower(user_email)));

CREATE INDEX IF NOT EXISTS idx_portal_admin_approvals_status
  ON public.portal_admin_approvals (status);

ALTER TABLE public.portal_admin_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own portal admin status or master reads all" ON public.portal_admin_approvals;
CREATE POLICY "Users read own portal admin status or master reads all"
  ON public.portal_admin_approvals
  FOR SELECT
  TO authenticated
  USING (
    lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com'
    OR user_id = (auth.uid())::text
    OR lower(user_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

DROP POLICY IF EXISTS "Users request portal admin or master inserts" ON public.portal_admin_approvals;
CREATE POLICY "Users request portal admin or master inserts"
  ON public.portal_admin_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com'
    OR (
      status = 'pending'
      AND user_id = (auth.uid())::text
      AND lower(user_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

DROP POLICY IF EXISTS "Only master admin updates portal admin approvals" ON public.portal_admin_approvals;
CREATE POLICY "Only master admin updates portal admin approvals"
  ON public.portal_admin_approvals
  FOR UPDATE
  TO authenticated
  USING (lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com');

DROP POLICY IF EXISTS "Only master admin deletes portal admin approvals" ON public.portal_admin_approvals;
CREATE POLICY "Only master admin deletes portal admin approvals"
  ON public.portal_admin_approvals
  FOR DELETE
  TO authenticated
  USING (lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com');

CREATE OR REPLACE FUNCTION public.is_portal_tournament_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt()->>'email', '')) = 'syahmi3122973@gmail.com'
    OR EXISTS (
      SELECT 1
      FROM public.portal_admin_approvals a
      WHERE a.status = 'approved'
        AND (
          a.user_id = (auth.uid())::text
          OR lower(a.user_email) = lower(coalesce(auth.jwt()->>'email', ''))
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_portal_tournament_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_portal_admin_on_scrims()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.portal_enabled = true)
     OR (TG_OP = 'UPDATE' AND (NEW.portal_enabled = true OR OLD.portal_enabled = true)) THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL
       AND current_setting('request.jwt.claims', true) <> '' THEN
      IF NOT public.is_portal_tournament_admin() THEN
        RAISE EXCEPTION 'Hanya admin diluluskan oleh syahmi3122973@gmail.com boleh membuka atau mengurus Portal Tournament.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_portal_admin_on_scrims ON public.scrims;
CREATE TRIGGER trg_enforce_portal_admin_on_scrims
  BEFORE INSERT OR UPDATE ON public.scrims
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_portal_admin_on_scrims();
