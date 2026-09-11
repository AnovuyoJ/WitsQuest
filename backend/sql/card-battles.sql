-- Run after schema.sql (or migrate-existing.sql) and content-publication.sql.
-- Rerunnable. Existing matches retain their original rules; new matches use version 2.
BEGIN;
-- Older installations may forbid owning multiple copies. Remove only collection
-- uniqueness on player/card (with or without event); retain primary keys.
DO $$ DECLARE old_constraint record; BEGIN
  FOR old_constraint IN
    SELECT con.conname FROM pg_constraint con WHERE con.conrelid='public.player_cards'::regclass AND con.contype='u'
    AND (SELECT array_agg(att.attname::text ORDER BY att.attname)
      FROM unnest(con.conkey) k JOIN pg_attribute att ON att.attrelid=con.conrelid AND att.attnum=k)
      IN (ARRAY['card_id','player_id']::text[], ARRAY['card_id','event_id','player_id']::text[])
  LOOP EXECUTE format('ALTER TABLE public.player_cards DROP CONSTRAINT %I',old_constraint.conname); END LOOP;
END $$;
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS rules_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS is_cpu boolean NOT NULL DEFAULT false;
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS winner_side integer CHECK (winner_side IN (1,2));
ALTER TABLE public.game_rounds ADD COLUMN IF NOT EXISTS winner_side integer CHECK (winner_side IN (1,2));
CREATE TABLE IF NOT EXISTS public.battle_decks (
  game_id uuid NOT NULL REFERENCES public.card_games(id) ON DELETE CASCADE,
  side integer NOT NULL CHECK (side IN (1,2)),
  card_id uuid NOT NULL REFERENCES public.cards(id),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 5),
  snapshot jsonb NOT NULL,
  PRIMARY KEY (game_id,side,card_id), UNIQUE(game_id,side,position)
);
ALTER TABLE public.battle_decks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.battle_decks FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.battle_decks FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.battle_decks FROM authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cards_battle_points_range' AND conrelid='public.cards'::regclass) THEN
    -- Preserve old values for admin review; all new/updated cards must satisfy the range.
    ALTER TABLE public.cards ADD CONSTRAINT cards_battle_points_range CHECK (points BETWEEN 0 AND 100) NOT VALID;
  END IF;
END $$;
COMMIT;
