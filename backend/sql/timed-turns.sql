-- Run once on existing databases to enable server-enforced 30-second battle turns.
BEGIN;
ALTER TABLE public.game_rounds ADD COLUMN IF NOT EXISTS turn_deadline timestamptz;
ALTER TABLE public.game_rounds ADD COLUMN IF NOT EXISTS player_one_timed_out boolean NOT NULL DEFAULT false;
ALTER TABLE public.game_rounds ADD COLUMN IF NOT EXISTS player_two_timed_out boolean NOT NULL DEFAULT false;
COMMIT;
