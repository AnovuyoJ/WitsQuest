-- Baseline for a NEW database. Existing projects: follow docs/handwritten-api.md first.
-- After this file, run content-publication.sql, trails.sql and card-battles.sql before starting the application.
-- Supabase supplies auth.users; this file does not manage authentication tables.
BEGIN;
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(), CHECK (ends_at > starts_at)
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY; 
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_meters integer NOT NULL CHECK (radius_meters > 0),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id),
  retired_at timestamptz,
  created_at timestamptz DEFAULT now(), CHECK (ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES public.events(id),
  title text NOT NULL, rarity text NOT NULL CHECK (rarity IN ('Blue','Black','Gold')),
  description text, accent text, badge text, strength text, points integer NOT NULL CHECK (points >= 0),
  tag text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.events(id),
  question_text text NOT NULL, question_type text NOT NULL CHECK (question_type IN ('text','true_false','multiple_choice')),
  options jsonb, correct_answer text NOT NULL, card_id uuid REFERENCES public.cards(id), created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.location_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_id uuid NOT NULL REFERENCES auth.users(id),
  event_id uuid NOT NULL REFERENCES public.events(id), distance_meters double precision NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  latitude double precision, longitude double precision,
  flagged boolean NOT NULL DEFAULT false, flag_reason text
);
CREATE TABLE IF NOT EXISTS public.challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_id uuid NOT NULL REFERENCES auth.users(id),
  event_id uuid NOT NULL REFERENCES public.events(id), challenge_id uuid NOT NULL REFERENCES public.challenges(id),
  correct boolean NOT NULL, answered_at timestamptz DEFAULT now(), UNIQUE(player_id,challenge_id)
);
CREATE TABLE IF NOT EXISTS public.player_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_id uuid NOT NULL REFERENCES auth.users(id),
  event_id uuid NOT NULL REFERENCES public.events(id), card_id uuid NOT NULL REFERENCES public.cards(id),
  awarded_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.card_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_one_id uuid NOT NULL REFERENCES auth.users(id),
  player_two_id uuid REFERENCES auth.users(id), category text NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting','active','finished','cancelled')),
  winner_id uuid REFERENCES auth.users(id), created_at timestamptz DEFAULT now(),
  started_at timestamptz, finished_at timestamptz,
  player_one_last_seen_at timestamptz, player_two_last_seen_at timestamptz,
  CHECK(player_one_id <> player_two_id)
);
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), game_id uuid NOT NULL REFERENCES public.card_games(id),
  round_number integer NOT NULL CHECK (round_number > 0),
  player_one_card_id uuid REFERENCES public.cards(id), player_two_card_id uuid REFERENCES public.cards(id),
  player_one_points integer, player_two_points integer, winner_id uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('waiting','ready','finished')),
  created_at timestamptz DEFAULT now(), finished_at timestamptz, UNIQUE(game_id,round_number)
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL, message text NOT NULL, href text, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS location_verifications_player_event_time ON public.location_verifications(player_id,event_id,verified_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_time ON public.notifications(user_id,created_at DESC);
COMMIT;