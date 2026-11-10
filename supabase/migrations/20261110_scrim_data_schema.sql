-- ============================================================================
-- Migration: Esports Scrim Management System (Supabase / PostgreSQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1.1 Scrim Sessions
CREATE TABLE IF NOT EXISTS public.scrim_sessions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scrim_name  text NOT NULL CHECK (char_length(btrim(scrim_name)) > 0),
    scrim_date  date NOT NULL DEFAULT CURRENT_DATE,
    image_url   text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Teams Master Directory
CREATE TABLE IF NOT EXISTS public.teams (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_slug      text NOT NULL UNIQUE,
    team_name      text NOT NULL UNIQUE,
    logo_url       text,
    total_matches  integer NOT NULL DEFAULT 0 CHECK (total_matches >= 0),
    total_wwcd     integer NOT NULL DEFAULT 0 CHECK (total_wwcd >= 0),
    total_kills    integer NOT NULL DEFAULT 0 CHECK (total_kills >= 0),
    created_at     timestamptz NOT NULL DEFAULT now()
);

-- 1.3 Scrim Standings
CREATE TABLE IF NOT EXISTS public.scrim_standings (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        uuid NOT NULL REFERENCES public.scrim_sessions(id) ON DELETE CASCADE,
    team_id           uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    rank              integer NOT NULL CHECK (rank > 0),
    team_name         text NOT NULL CHECK (char_length(btrim(team_name)) > 0),
    wwcd              integer NOT NULL DEFAULT 0 CHECK (wwcd >= 0),
    placement_points  integer NOT NULL DEFAULT 0 CHECK (placement_points >= 0),
    kill_points       integer NOT NULL DEFAULT 0 CHECK (kill_points >= 0),
    total_points      integer NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),

    -- 2. CONSTRAINTS
    CONSTRAINT uq_scrim_standings_session_rank
        UNIQUE (session_id, rank),
    CONSTRAINT uq_scrim_standings_session_team
        UNIQUE (session_id, team_name),
    CONSTRAINT chk_scrim_standings_total_points
        CHECK (total_points = (placement_points + kill_points))
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scrim_standings_session_id
    ON public.scrim_standings (session_id);

CREATE INDEX IF NOT EXISTS idx_scrim_standings_rank
    ON public.scrim_standings (rank);

CREATE INDEX IF NOT EXISTS idx_scrim_standings_session_rank
    ON public.scrim_standings (session_id, rank);

-- ============================================================================
-- 3. TRIGGER & FUNCTION: AUTO-SYNC TEAMS ON STANDINGS INSERT
-- ============================================================================

-- Helper: Normalize team_name into a URL-safe, lowercase slug
CREATE OR REPLACE FUNCTION public.normalize_team_slug(input_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT trim(both '-' FROM regexp_replace(lower(btrim(input_name)), '[^a-z0-9]+', '-', 'g'));
$$;

-- Trigger Function: Upsert team stats and link team_id on new standing row
CREATE OR REPLACE FUNCTION public.fn_sync_team_from_standing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_name text;
    v_slug       text;
    v_team_id    uuid;
BEGIN
    v_clean_name := btrim(NEW.team_name);
    v_slug       := public.normalize_team_slug(v_clean_name);

    IF v_slug = '' THEN
        RAISE EXCEPTION 'Invalid team_name "%": slug cannot be empty', NEW.team_name;
    END IF;

    -- Upsert into teams and accumulate career totals
    INSERT INTO public.teams (
        team_slug,
        team_name,
        total_matches,
        total_wwcd,
        total_kills
    )
    VALUES (
        v_slug,
        v_clean_name,
        1,
        COALESCE(NEW.wwcd, 0),
        COALESCE(NEW.kill_points, 0)
    )
    ON CONFLICT (team_slug) DO UPDATE
    SET
        total_matches = public.teams.total_matches + 1,
        total_wwcd    = public.teams.total_wwcd + COALESCE(EXCLUDED.total_wwcd, 0),
        total_kills   = public.teams.total_kills + COALESCE(EXCLUDED.total_kills, 0)
    RETURNING id INTO v_team_id;

    -- Link standing record to the resolved team_id
    NEW.team_name := v_clean_name;
    NEW.team_id   := v_team_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_team_on_standing_insert ON public.scrim_standings;

CREATE TRIGGER trg_sync_team_on_standing_insert
    BEFORE INSERT ON public.scrim_standings
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_team_from_standing();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.scrim_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams           ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT
        auth.role() = 'authenticated'
        AND COALESCE(
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
            OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true,
            true
        );
$$;

-- 4.1 Public Read Access (Everyone)
CREATE POLICY "Public read access on scrim_sessions"
    ON public.scrim_sessions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access on scrim_standings"
    ON public.scrim_standings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access on teams"
    ON public.teams FOR SELECT TO anon, authenticated USING (true);

-- 4.2 Admin Write Access (Insert / Update / Delete)
CREATE POLICY "Admins can insert scrim_sessions"
    ON public.scrim_sessions FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can update scrim_sessions"
    ON public.scrim_sessions FOR UPDATE TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can delete scrim_sessions"
    ON public.scrim_sessions FOR DELETE TO authenticated USING (public.is_authenticated_admin());

CREATE POLICY "Admins can insert scrim_standings"
    ON public.scrim_standings FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can update scrim_standings"
    ON public.scrim_standings FOR UPDATE TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can delete scrim_standings"
    ON public.scrim_standings FOR DELETE TO authenticated USING (public.is_authenticated_admin());

CREATE POLICY "Admins can insert teams"
    ON public.teams FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can update teams"
    ON public.teams FOR UPDATE TO authenticated USING (public.is_authenticated_admin()) WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can delete teams"
    ON public.teams FOR DELETE TO authenticated USING (public.is_authenticated_admin());

