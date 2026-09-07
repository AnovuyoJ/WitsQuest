-- Run after schema.sql and content-publication.sql, before deploying trail routes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text,
  event_ids uuid[] NOT NULL CHECK (cardinality(event_ids) BETWEEN 2 AND 20),
  draft_revision integer NOT NULL DEFAULT 1,
  reviewed_revision integer, reviewed_by uuid,
  published_revision integer, published_snapshot jsonb, published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trails FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.trails FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.trails FROM authenticated; END IF;
END $$;
COMMIT;
