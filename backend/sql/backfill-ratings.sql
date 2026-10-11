-- Run once after rating-seasons.sql to calculate Elo from stored human match outcomes.
-- Refuses to run after any non-default rating has already been recorded.
BEGIN;
SELECT pg_advisory_xact_lock(74192002);
DO $$
DECLARE
  outcome record;
  rating_one integer;
  rating_two integer;
  delta_one integer;
  delta_two integer;
  expected_one double precision;
  wins_one integer;
  losses_one integer;
  draws_one integer;
  wins_two integer;
  losses_two integer;
  draws_two integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.player_ratings WHERE rating<>1200 OR games_played<>0
    OR wins<>0 OR losses<>0 OR draws<>0) THEN
    RAISE EXCEPTION 'Historical rating backfill requires untouched default ratings.';
  END IF;

  FOR outcome IN
    SELECT result_at,player_one_id,player_two_id,score_one,game_id,result_order
    FROM (
      SELECT COALESCE(g.finished_at,g.created_at) AS result_at,g.player_one_id,g.player_two_id,
        CASE WHEN g.winner_id IS NULL THEN 0.5 WHEN g.winner_id=g.player_one_id THEN 1.0 ELSE 0.0 END::double precision AS score_one,
        g.id AS game_id,0 AS result_order
      FROM public.card_games g
      WHERE g.status='finished' AND g.rules_version=2 AND g.is_cpu=false AND g.player_two_id IS NOT NULL
      UNION ALL
      SELECT COALESCE(r.finished_at,r.created_at) AS result_at,g.player_one_id,g.player_two_id,
        CASE WHEN r.winner_id IS NULL THEN 0.5 WHEN r.winner_id=g.player_one_id THEN 1.0 ELSE 0.0 END::double precision AS score_one,
        g.id AS game_id,r.round_number AS result_order
      FROM public.game_rounds r JOIN public.card_games g ON g.id=r.game_id
      WHERE r.status='finished' AND COALESCE(g.rules_version,1)<>2 AND g.is_cpu=false AND g.player_two_id IS NOT NULL
    ) results
    ORDER BY result_at,game_id,result_order
  LOOP
    SELECT COALESCE((SELECT rating FROM public.player_ratings WHERE player_id=outcome.player_one_id),1200)
      INTO rating_one;
    SELECT COALESCE((SELECT rating FROM public.player_ratings WHERE player_id=outcome.player_two_id),1200)
      INTO rating_two;
    expected_one := 1.0/(1.0+power(10.0,(rating_two-rating_one)::double precision/400.0));
    delta_one := round(32.0*(outcome.score_one-expected_one))::integer;
    delta_two := round(32.0*((1.0-outcome.score_one)-(1.0-expected_one)))::integer;
    wins_one := CASE WHEN outcome.score_one=1 THEN 1 ELSE 0 END;
    losses_one := CASE WHEN outcome.score_one=0 THEN 1 ELSE 0 END;
    draws_one := CASE WHEN outcome.score_one=0.5 THEN 1 ELSE 0 END;
    wins_two := losses_one;
    losses_two := wins_one;
    draws_two := draws_one;

    INSERT INTO public.player_ratings (player_id,rating,games_played,wins,losses,draws,updated_at)
      VALUES (outcome.player_one_id,GREATEST(0,rating_one+delta_one),1,wins_one,losses_one,draws_one,now())
      ON CONFLICT (player_id) DO UPDATE SET rating=GREATEST(0,public.player_ratings.rating+delta_one),
        games_played=public.player_ratings.games_played+1,wins=public.player_ratings.wins+wins_one,
        losses=public.player_ratings.losses+losses_one,draws=public.player_ratings.draws+draws_one,updated_at=now();
    INSERT INTO public.player_ratings (player_id,rating,games_played,wins,losses,draws,updated_at)
      VALUES (outcome.player_two_id,GREATEST(0,rating_two+delta_two),1,wins_two,losses_two,draws_two,now())
      ON CONFLICT (player_id) DO UPDATE SET rating=GREATEST(0,public.player_ratings.rating+delta_two),
        games_played=public.player_ratings.games_played+1,wins=public.player_ratings.wins+wins_two,
        losses=public.player_ratings.losses+losses_two,draws=public.player_ratings.draws+draws_two,updated_at=now();
  END LOOP;
END $$;

UPDATE public.rating_seasons SET starts_at=COALESCE((
  SELECT min(result_at) FROM (
    SELECT COALESCE(g.finished_at,g.created_at) AS result_at FROM public.card_games g
    WHERE g.status='finished' AND g.rules_version=2 AND g.is_cpu=false AND g.player_two_id IS NOT NULL
    UNION ALL
    SELECT COALESCE(r.finished_at,r.created_at) FROM public.game_rounds r
    JOIN public.card_games g ON g.id=r.game_id
    WHERE r.status='finished' AND COALESCE(g.rules_version,1)<>2 AND g.is_cpu=false AND g.player_two_id IS NOT NULL
  ) outcomes
),starts_at) WHERE ends_at IS NULL;
COMMIT;