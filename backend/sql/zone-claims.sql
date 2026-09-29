-- Run after schema.sql and zones.sql.
-- Stores the current player who controls each zone.

BEGIN;

CREATE TABLE IF NOT EXISTS public.zone_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  zone_id uuid NOT NULL
    REFERENCES public.zones(id)
    ON DELETE CASCADE,

  player_id uuid NOT NULL
    REFERENCES auth.users(id),

  claimed_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(zone_id)
);

ALTER TABLE public.zone_claims ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS zone_claims_player_idx
  ON public.zone_claims(player_id);

COMMIT;