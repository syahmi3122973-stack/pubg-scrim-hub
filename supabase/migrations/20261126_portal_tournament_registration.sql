-- Portal Tournament: Team Registration, Client-Side OCR & QR Receipt Verification
-- 1. Extend public.scrims with Portal Tournament session fields
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS event_category text,
  ADD COLUMN IF NOT EXISTS session_timing text,
  ADD COLUMN IF NOT EXISTS entry_fee numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_slots integer NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS whatsapp_lobby_link text,
  ADD COLUMN IF NOT EXISTS qr_image_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scrims_event_category_check'
  ) THEN
    ALTER TABLE public.scrims
      ADD CONSTRAINT scrims_event_category_check
      CHECK (event_category IS NULL OR event_category IN ('Night Scrim', 'Mid Scrim', 'Fast Tour'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scrims_max_slots_check'
  ) THEN
    ALTER TABLE public.scrims
      ADD CONSTRAINT scrims_max_slots_check
      CHECK (max_slots >= 2 AND max_slots <= 25);
  END IF;
END $$;

-- 2. Create tournament_registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id text NOT NULL REFERENCES public.scrims(id) ON DELETE CASCADE,
  registered_by text NOT NULL DEFAULT (auth.uid())::text,
  team_name text NOT NULL,
  team_tag text NOT NULL,
  captain_whatsapp text NOT NULL,
  captain_email text,
  receipt_image_url text,
  ocr_extracted_amount numeric(10, 2),
  ocr_reference_no text,
  is_duplicate_ref boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  assigned_slot integer,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_reg_scrim_status
  ON public.tournament_registrations (scrim_id, status);

CREATE INDEX IF NOT EXISTS idx_tournament_reg_ref_norm
  ON public.tournament_registrations ((upper(regexp_replace(coalesce(ocr_reference_no, ''), '[^a-zA-Z0-9]', '', 'g'))));

CREATE INDEX IF NOT EXISTS idx_tournament_reg_whatsapp_digits
  ON public.tournament_registrations ((regexp_replace(captain_whatsapp, '\D', '', 'g')));

-- 3. RLS Policies
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated insert own registration" ON public.tournament_registrations;
CREATE POLICY "Authenticated insert own registration"
  ON public.tournament_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = registered_by);

DROP POLICY IF EXISTS "Users read own registrations" ON public.tournament_registrations;
CREATE POLICY "Users read own registrations"
  ON public.tournament_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = registered_by);

DROP POLICY IF EXISTS "Hosts and master read session registrations" ON public.tournament_registrations;
CREATE POLICY "Hosts and master read session registrations"
  ON public.tournament_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scrims s
      WHERE s.id = tournament_registrations.scrim_id
        AND (
          s.created_by = auth.uid()::text
          OR auth.uid()::text = ANY(coalesce(s.co_hosts, '{}'))
          OR (auth.jwt()->>'email') = 'syahmi3122973@gmail.com'
        )
    )
  );

DROP POLICY IF EXISTS "Hosts and master update session registrations" ON public.tournament_registrations;
CREATE POLICY "Hosts and master update session registrations"
  ON public.tournament_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scrims s
      WHERE s.id = tournament_registrations.scrim_id
        AND (
          s.created_by = auth.uid()::text
          OR auth.uid()::text = ANY(coalesce(s.co_hosts, '{}'))
          OR (auth.jwt()->>'email') = 'syahmi3122973@gmail.com'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scrims s
      WHERE s.id = tournament_registrations.scrim_id
        AND (
          s.created_by = auth.uid()::text
          OR auth.uid()::text = ANY(coalesce(s.co_hosts, '{}'))
          OR (auth.jwt()->>'email') = 'syahmi3122973@gmail.com'
        )
    )
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. SECURITY DEFINER RPCs
CREATE OR REPLACE FUNCTION public.check_ocr_reference_exists(p_ref text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(upper(regexp_replace(coalesce(p_ref, ''), '[^a-zA-Z0-9]', '', 'g'))) < 4 THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.tournament_registrations r
      WHERE r.status <> 'rejected'
        AND upper(regexp_replace(coalesce(r.ocr_reference_no, ''), '[^a-zA-Z0-9]', '', 'g')) =
            upper(regexp_replace(coalesce(p_ref, ''), '[^a-zA-Z0-9]', '', 'g'))
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_open_registration_slot_counts()
RETURNS TABLE (
  scrim_id text,
  verified_count bigint,
  pending_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.scrim_id,
    count(*) FILTER (WHERE r.status = 'verified') AS verified_count,
    count(*) FILTER (WHERE r.status = 'pending_verification') AS pending_count
  FROM public.tournament_registrations r
  GROUP BY r.scrim_id;
$$;

CREATE OR REPLACE FUNCTION public.check_registration_status(p_whatsapp text)
RETURNS TABLE (
  id uuid,
  scrim_id text,
  session_title text,
  event_category text,
  session_timing text,
  session_date text,
  team_name text,
  team_tag text,
  status text,
  assigned_slot integer,
  whatsapp_lobby_link text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH norm_input AS (
    SELECT regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g') AS digits
  )
  SELECT
    r.id,
    r.scrim_id,
    s.title AS session_title,
    s.event_category,
    s.session_timing,
    s.date AS session_date,
    r.team_name,
    r.team_tag,
    r.status,
    r.assigned_slot,
    CASE WHEN r.status = 'verified' THEN s.whatsapp_lobby_link ELSE NULL END AS whatsapp_lobby_link,
    r.created_at
  FROM public.tournament_registrations r
  JOIN public.scrims s ON s.id = r.scrim_id
  CROSS JOIN norm_input ni
  WHERE length(ni.digits) >= 8
    AND right(regexp_replace(r.captain_whatsapp, '\D', '', 'g'), 8) = right(ni.digits, 8)
  ORDER BY r.created_at DESC
  LIMIT 25;
$$;

GRANT EXECUTE ON FUNCTION public.check_ocr_reference_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_open_registration_slot_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_registration_status(text) TO anon, authenticated;
