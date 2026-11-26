-- Add prize_pool column to public.scrims for Portal Tournament info page
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS prize_pool text;
