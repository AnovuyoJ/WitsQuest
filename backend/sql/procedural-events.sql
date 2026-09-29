BEGIN;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_procedural boolean NOT NULL DEFAULT false;

COMMIT;