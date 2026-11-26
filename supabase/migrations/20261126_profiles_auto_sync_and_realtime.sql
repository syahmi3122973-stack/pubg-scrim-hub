-- Auto-create public.profiles rows on signup, backfill existing auth.users, and enable Realtime on public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_name text;
  default_avatar text;
BEGIN
  default_name := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Host Berdaftar'
  );
  default_avatar := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'picture'), ''),
    ''
  );

  INSERT INTO public.profiles (id, display_name, contact, bio, avatar_url, updated_at)
  VALUES (
    NEW.id::text,
    LEFT(default_name, 60),
    '',
    '',
    default_avatar,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, display_name, contact, bio, avatar_url, updated_at)
SELECT
  u.id::text,
  LEFT(
    COALESCE(
      NULLIF(BTRIM(u.raw_user_meta_data->>'full_name'), ''),
      NULLIF(BTRIM(u.raw_user_meta_data->>'name'), ''),
      NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
      'Host Berdaftar'
    ),
    60
  ),
  '',
  '',
  COALESCE(
    NULLIF(BTRIM(u.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(BTRIM(u.raw_user_meta_data->>'picture'), ''),
    ''
  ),
  COALESCE(u.created_at, now())
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END
$$;
