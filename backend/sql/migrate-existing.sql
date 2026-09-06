-- Upgrade the tables described in docs/Design/system-design.md without deleting records.
-- Back up the database and inspect this migration before applying it to an existing project.
BEGIN;
ALTER TABLE public.challenge_attempts ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.challenges(id);
-- Old attempts can only be mapped automatically when their event has exactly one challenge.
UPDATE public.challenge_attempts a SET challenge_id=c.id
FROM public.challenges c WHERE a.challenge_id IS NULL AND a.event_id=c.event_id
  AND (SELECT count(*) FROM public.challenges other WHERE other.event_id=a.event_id)=1;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.challenge_attempts WHERE challenge_id IS NULL) THEN
    RAISE EXCEPTION 'Unmapped legacy attempts: assign challenge_id using historical data before rerunning this migration. No changes have been committed.';
  END IF;
END $$;
ALTER TABLE public.challenge_attempts ALTER COLUMN challenge_id SET NOT NULL;
-- Replace the legacy per-event attempt constraint with per-question uniqueness.
DO $$ DECLARE old_constraint record; BEGIN
  FOR old_constraint IN
    SELECT con.conname FROM pg_constraint con WHERE con.conrelid='public.challenge_attempts'::regclass
    AND con.contype='u' AND (SELECT array_agg(att.attname::text ORDER BY att.attname)
      FROM unnest(con.conkey) k JOIN pg_attribute att ON att.attrelid=con.conrelid AND att.attnum=k)
      = ARRAY['event_id','player_id']::text[]
  LOOP EXECUTE format('ALTER TABLE public.challenge_attempts DROP CONSTRAINT %I',old_constraint.conname); END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS challenge_attempts_player_question ON public.challenge_attempts(player_id,challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS game_rounds_game_number ON public.game_rounds(game_id,round_number);
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS player_one_last_seen_at timestamptz;
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS player_two_last_seen_at timestamptz;
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL, message text NOT NULL, href text, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
-- Match the existing hosted notification recipient column.
CREATE INDEX IF NOT EXISTS notifications_user_time ON public.notifications(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS location_verifications_player_event_time ON public.location_verifications(player_id,event_id,verified_at DESC);
COMMIT;
