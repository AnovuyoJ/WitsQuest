-- Apply after schema.sql, before deploying trust and moderation API routes.
-- Browser roles have no direct access; the Express API enforces administrator access.
BEGIN;
CREATE TABLE IF NOT EXISTS public.player_trust_score (
  player_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','watched','restricted','banned')),
  last_updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.trust_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity integer NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved')),
  action_taken text NOT NULL DEFAULT 'none' CHECK (action_taken IN ('none','warning','throttle','restricted','banned')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS trust_events_player_time ON public.trust_events(player_id,created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_flags_status ON public.moderation_flags(status,created_at DESC);
ALTER TABLE public.player_trust_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.player_trust_score,public.trust_events,public.moderation_flags FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON public.player_trust_score,public.trust_events,public.moderation_flags FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON public.player_trust_score,public.trust_events,public.moderation_flags FROM authenticated;
  END IF;
END $$;
COMMIT;