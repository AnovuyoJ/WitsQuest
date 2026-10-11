import { getSupabaseDataClient } from "./supabaseDataClient";

const K_FACTOR = 32;

/**
 * Fetches or initializes a player's competitive rating.
 */
export async function getPlayerRating(playerId: string): Promise<number> {
  const { data } = await getSupabaseDataClient()
    .from("player_ratings")
    .select("rating")
    .eq("player_id", playerId)
    .maybeSingle();

  if (!data) {
    await getSupabaseDataClient().from("player_ratings").insert({
      player_id: playerId,
      rating: 1200,
      games_played: 0,
      wins: 0,
      losses: 0,
    });
    return 1200;
  }

  return data.rating;
}

/**
 * Updates player ratings after a finished match using standard Elo logic.
 */
export async function updateMatchRatings(winnerId: string, loserId: string) {
  const ratingA = await getPlayerRating(winnerId);
  const ratingB = await getPlayerRating(loserId);

  // Win probability
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  const newRatingA = Math.round(ratingA + K_FACTOR * (1 - expectedA));
  const newRatingB = Math.max(0, Math.round(ratingB + K_FACTOR * (0 - expectedB)));

  await Promise.all([
    getSupabaseDataClient().rpc("increment_player_stats", {
      p_id: winnerId,
      p_rating_delta: newRatingA - ratingA,
      p_is_win: true,
    }),
    getSupabaseDataClient().rpc("increment_player_stats", {
      p_id: loserId,
      p_rating_delta: newRatingB - ratingB,
      p_is_win: false,
    }),
  ]);

  return { newRatingA, newRatingB };
}