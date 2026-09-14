BEGIN;
ALTER TABLE public.card_games ADD COLUMN IF NOT EXISTS stakes_enabled boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.battle_stakes (
 game_id uuid NOT NULL REFERENCES public.card_games(id) ON DELETE CASCADE,
 side integer NOT NULL CHECK (side IN (1,2)), copy_id uuid NOT NULL, snapshot jsonb NOT NULL,
 accepted boolean NOT NULL DEFAULT false, settled boolean NOT NULL DEFAULT false, PRIMARY KEY(game_id,side)
);
ALTER TABLE public.battle_stakes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.battle_stakes FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.battle_stakes FROM anon; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.battle_stakes FROM authenticated; END IF;
END $$;
COMMIT;
