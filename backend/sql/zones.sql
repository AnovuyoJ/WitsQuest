-- Run after schema.sql and content-publication.sql.
-- Defines author-created zones made up of existing campus locations/events.

BEGIN;

CREATE TABLE IF NOT EXISTS public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zone_locations (
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  PRIMARY KEY (zone_id, event_id)
);

COMMIT;