import type { PoolClient } from "pg";
import { HttpError } from "./validation";

export async function reserveStake(client: PoolClient, gameId: string, side: number, playerId: string, cardId: string) {
  const copy = (await client.query(`SELECT pc.id,row_to_json(c) AS snapshot FROM public.player_cards pc JOIN public.cards c ON c.id=pc.card_id
    WHERE pc.player_id=$1 AND pc.card_id=$2 ORDER BY pc.awarded_at,pc.id LIMIT 1 FOR UPDATE OF pc`, [playerId,cardId])).rows[0];
  if (!copy) throw new HttpError(409,"You no longer own your staked card.");
  await client.query("INSERT INTO public.battle_stakes (game_id,side,copy_id,snapshot) VALUES ($1,$2,$3,$4)", [gameId,side,copy.id,JSON.stringify(copy.snapshot)]);
}
export async function stakesReady(client: PoolClient, gameId: string) {
  const rows = (await client.query("SELECT accepted FROM public.battle_stakes WHERE game_id=$1", [gameId])).rows;
  return rows.length === 2 && rows.every(row => row.accepted);
}
export async function settleStakes(client: PoolClient, game: { id: string; stakes_enabled?: boolean; player_one_id: string; player_two_id: string }, winner: number | null) {
  if (!game.stakes_enabled) return;
  const stakes = (await client.query("SELECT * FROM public.battle_stakes WHERE game_id=$1 ORDER BY side FOR UPDATE", [game.id])).rows;
  if (stakes.length === 2 && stakes.every(stake => stake.settled)) return;
  if (stakes.length !== 2 || !stakes.every(stake => stake.accepted)) throw new HttpError(409,"Both players must accept the stakes first.");
  if (winner !== null) {
    for (const player of [game.player_one_id,game.player_two_id].sort()) await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [player]);
    const losingStake = stakes.find(stake => stake.side !== winner);
    const loser = winner === 1 ? game.player_two_id : game.player_one_id;
    const recipient = winner === 1 ? game.player_one_id : game.player_two_id;
    const result = await client.query("UPDATE public.player_cards SET player_id=$1,awarded_at=now() WHERE id=$2 AND player_id=$3 RETURNING id", [recipient,losingStake.copy_id,loser]);
    if (!result.rowCount) throw new HttpError(409,"The staked card is unavailable. The match could not be settled.");
  }
  await client.query("UPDATE public.battle_stakes SET settled=true WHERE game_id=$1", [game.id]);
}
