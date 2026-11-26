-- Isolate Portal Tournament sessions from regular Scrim Hub sessions
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS portal_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_scrims_portal_enabled
  ON public.scrims (portal_enabled, is_finished, date DESC);
