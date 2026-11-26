-- Add room_type column to public.scrims for Portal Tournament session info
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'Squad TPP';
