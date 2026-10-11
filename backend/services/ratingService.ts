import { PoolClient } from "pg";
import { database, transaction } from "./database";
import { HttpError } from "./validation";

export const INITIAL_RATING = 1200;
const K_FACTOR = 32;

export function matchmakingTolerance(waitSeconds: number): number {
  return Math.min(600, 150 + Math.floor(Math.max(0, waitSeconds) / 15) * 50);
}

export async function updateRatingsInTx(
  client: PoolClient,
  playerOneId: string,
  playerTwoId: string,
  scoreOne: 0 | 0.5 | 1,
  ratingOne?: number,
  ratingTwo?: number,
) {
  await client.query("SELECT pg_advisory_xact_lock(74192002)");
  const existingRatings = (await client.query(`SELECT player_id,rating FROM public.player_ratings
    WHERE player_id=ANY($1::uuid[]) FOR UPDATE`, [[playerOneId,playerTwoId]])).rows;
  const storedOne = existingRatings.find(row => row.player_id === playerOneId)?.rating;
  const storedTwo = existingRatings.find(row => row.player_id === playerTwoId)?.rating;
  const effectiveRatingOne = ratingOne ?? storedOne ?? INITIAL_RATING;
  const effectiveRatingTwo = ratingTwo ?? storedTwo ?? INITIAL_RATING;
  const expectedOne = 1 / (1 + Math.pow(10, (effectiveRatingTwo - effectiveRatingOne) / 400));
  const deltaOne = Math.round(K_FACTOR * (scoreOne - expectedOne));
  const deltaTwo = Math.round(K_FACTOR * (1 - scoreOne - (1 - expectedOne)));
  const oneStats = { wins: scoreOne === 1 ? 1 : 0, losses: scoreOne === 0 ? 1 : 0, draws: scoreOne === 0.5 ? 1 : 0 };
  const twoStats = { wins: scoreOne === 0 ? 1 : 0, losses: scoreOne === 1 ? 1 : 0, draws: scoreOne === 0.5 ? 1 : 0 };

  await client.query(`INSERT INTO public.player_ratings (player_id,rating,games_played,wins,losses,draws,updated_at)
    VALUES ($1,GREATEST(0,$2::integer+$3::integer),1,$4,$5,$6,now())
    ON CONFLICT (player_id) DO UPDATE SET
      rating=GREATEST(0,public.player_ratings.rating+$3),
      games_played=public.player_ratings.games_played+1,
      wins=public.player_ratings.wins+$4,
      losses=public.player_ratings.losses+$5,
      draws=public.player_ratings.draws+$6,
      updated_at=now()`, [playerOneId,effectiveRatingOne,deltaOne,oneStats.wins,oneStats.losses,oneStats.draws]);
  await client.query(`INSERT INTO public.player_ratings (player_id,rating,games_played,wins,losses,draws,updated_at)
    VALUES ($1,GREATEST(0,$2::integer+$3::integer),1,$4,$5,$6,now())
    ON CONFLICT (player_id) DO UPDATE SET
      rating=GREATEST(0,public.player_ratings.rating+$3),
      games_played=public.player_ratings.games_played+1,
      wins=public.player_ratings.wins+$4,
      losses=public.player_ratings.losses+$5,
      draws=public.player_ratings.draws+$6,
      updated_at=now()`, [playerTwoId,effectiveRatingTwo,deltaTwo,twoStats.wins,twoStats.losses,twoStats.draws]);
}

export async function getPlayerRatingSummary(playerId: string) {
  const [current, history] = await Promise.all([
    database.query(`SELECT s.name AS season_name,COALESCE(r.rating,$2)::int AS rating
      FROM public.rating_seasons s LEFT JOIN public.player_ratings r ON r.player_id=$1
      WHERE s.ends_at IS NULL LIMIT 1`, [playerId,INITIAL_RATING]),
    database.query(`SELECT s.name AS season_name,h.rating,h.games_played,h.wins,h.losses,h.draws
      FROM public.player_rating_history h JOIN public.rating_seasons s ON s.id=h.season_id
      WHERE h.player_id=$1 ORDER BY s.ends_at DESC`, [playerId]),
  ]);
  return {
    season: current.rows[0]?.season_name ?? "Season 1",
    rating: current.rows[0]?.rating ?? INITIAL_RATING,
    ratingHistory: history.rows,
  };
}

export async function resetRatingSeason(name: string) {
  return transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(74192002)");
    const active = (await client.query("SELECT id FROM public.rating_seasons WHERE ends_at IS NULL FOR UPDATE")).rows[0];
    if (!active) throw new HttpError(409, "There is no active rating season to close.");
    const liveGames = (await client.query(`SELECT count(*)::int AS count FROM public.card_games
      WHERE is_cpu=false AND status IN ('waiting','active')`)).rows[0].count;
    if (liveGames) throw new HttpError(409, "Complete or cancel all player battles before resetting the rating season.");
    if ((await client.query("SELECT 1 FROM public.rating_seasons WHERE name=$1", [name])).rows.length) {
      throw new HttpError(409, "A rating season with that name already exists.");
    }

    await client.query(`INSERT INTO public.player_rating_history
      (season_id,player_id,rating,games_played,wins,losses,draws)
      SELECT $1,u.id,COALESCE(r.rating,$2),COALESCE(r.games_played,0),COALESCE(r.wins,0),
        COALESCE(r.losses,0),COALESCE(r.draws,0)
      FROM auth.users u LEFT JOIN public.player_ratings r ON r.player_id=u.id
      ON CONFLICT (season_id,player_id) DO NOTHING`, [active.id,INITIAL_RATING]);
    await client.query("UPDATE public.rating_seasons SET ends_at=now() WHERE id=$1", [active.id]);
    const season = (await client.query(`INSERT INTO public.rating_seasons (name,starts_at)
      VALUES ($1,now()) RETURNING id,name,starts_at`, [name])).rows[0];
    await client.query(`UPDATE public.player_ratings SET rating=$1,games_played=0,wins=0,losses=0,draws=0,updated_at=now()`, [INITIAL_RATING]);
    return season;
  });
}