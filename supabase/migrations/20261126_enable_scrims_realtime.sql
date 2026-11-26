-- Enable Supabase Realtime events for public.scrims so new/updated sessions appear live across devices without page reload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'scrims'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scrims;
  END IF;
END
$$;
