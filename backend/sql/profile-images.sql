BEGIN;
CREATE TABLE IF NOT EXISTS public.player_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar text NOT NULL CHECK (length(avatar) <= 180000)
);
CREATE TABLE IF NOT EXISTS public.album_covers (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  image text NOT NULL CHECK (length(image) <= 180000)
);
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_covers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_profiles, public.album_covers FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.player_profiles, public.album_covers FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.player_profiles, public.album_covers FROM authenticated; END IF;
END $$;
COMMIT;
