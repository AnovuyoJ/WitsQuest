-- Apply after the Express deployment has been verified. Keep Supabase Auth enabled.
-- Also disable the Data API in the project's Supabase settings.
BEGIN;
REVOKE ALL ON public.events, public.cards, public.challenges, public.location_verifications,
  public.challenge_attempts, public.player_cards, public.card_games, public.game_rounds,
  public.notifications FROM PUBLIC, anon, authenticated;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Old RPCs may use SECURITY DEFINER and bypass table grants. Remove their public execution paths.
DO $$ DECLARE fn record; BEGIN
  FOR fn IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
    AND p.proname IN ('forfeit_card_game','get_card_game_player_names','touch_card_game_presence','resolve_card_game_round')
  LOOP EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature); END LOOP;
END $$;
COMMIT;
