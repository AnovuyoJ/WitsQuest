-- Apply after schema.sql (new projects) or the existing-schema migration.
-- Existing content stays live; new records default to unpublished drafts.
BEGIN;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS draft_revision integer NOT NULL DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_revision integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_snapshot jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reviewed_revision integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS draft_revision integer NOT NULL DEFAULT 1;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS published_revision integer;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS published_snapshot jsonb;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS reviewed_revision integer;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- A migration marker prevents reruns from publishing newly saved drafts.
CREATE TABLE IF NOT EXISTS public.content_migrations (name text PRIMARY KEY);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.content_migrations WHERE name='draft-publication-v1') THEN
    UPDATE public.events e SET published_snapshot=to_jsonb(e)-'published_snapshot',
      published_revision=draft_revision, published_at=now();
    UPDATE public.challenges c SET published_snapshot=to_jsonb(c)-'published_snapshot',
      published_revision=draft_revision, published_at=now();
    INSERT INTO public.content_migrations VALUES ('draft-publication-v1');
  END IF;
END $$;

CREATE OR REPLACE VIEW public.live_events AS
  SELECT live.* FROM public.events e
  CROSS JOIN LATERAL jsonb_populate_record(NULL::public.events,e.published_snapshot) live
  WHERE e.published_snapshot IS NOT NULL AND e.retired_at IS NULL;
CREATE OR REPLACE VIEW public.live_challenges AS
  SELECT live.* FROM public.challenges c
  CROSS JOIN LATERAL jsonb_populate_record(NULL::public.challenges,c.published_snapshot) live
  WHERE c.published_snapshot IS NOT NULL;
REVOKE ALL ON public.live_events, public.live_challenges, public.content_migrations FROM PUBLIC;
-- Hosted Supabase roles may have default grants; keep views backend-only.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON public.live_events, public.live_challenges, public.content_migrations FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON public.live_events, public.live_challenges, public.content_migrations FROM authenticated;
  END IF;
END $$;
COMMIT;
