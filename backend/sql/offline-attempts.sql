-- Server-issued leases for bounded, replay-safe offline challenge attempts.
BEGIN;
CREATE TABLE IF NOT EXISTS public.offline_attempt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  verification_id uuid NOT NULL REFERENCES public.location_verifications(id) ON DELETE CASCADE,
  challenge_revision integer,
  correct_answer_snapshot text NOT NULL,
  card_id_snapshot uuid REFERENCES public.cards(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  sync_deadline timestamptz NOT NULL,
  consumed_at timestamptz,
  client_attempt_id uuid UNIQUE,
  CHECK (expires_at > issued_at),
  CHECK (sync_deadline >= expires_at)
);
CREATE INDEX IF NOT EXISTS offline_attempt_sessions_player_challenge
  ON public.offline_attempt_sessions(player_id, challenge_id, issued_at DESC);
ALTER TABLE public.offline_attempt_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offline_attempt_sessions FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON public.offline_attempt_sessions FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON public.offline_attempt_sessions FROM authenticated;
  END IF;
END $$;
COMMIT;
