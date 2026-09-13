import { transaction } from "./database";
import { HttpError } from "./validation";

export async function deleteAccount(userId: string) {
  await transaction(async client => {
    // Block new foreign-key references while the account is being removed.
    const user = await client.query("SELECT id FROM auth.users WHERE id=$1 FOR UPDATE", [userId]);
    if (!user.rows.length) throw new HttpError(401, "This account no longer exists.");
    const games = await client.query(`SELECT id FROM public.card_games
      WHERE player_one_id=$1 OR player_two_id=$1 FOR UPDATE`, [userId]);
    const gameIds = games.rows.map(row => row.id);
    await client.query("DELETE FROM public.battle_decks WHERE game_id=ANY($1::uuid[])", [gameIds]);
    await client.query("DELETE FROM public.game_rounds WHERE game_id=ANY($1::uuid[])", [gameIds]);
    await client.query("DELETE FROM public.card_games WHERE id=ANY($1::uuid[])", [gameIds]);
    await client.query("DELETE FROM public.notifications WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM public.challenge_attempts WHERE player_id=$1", [userId]);
    await client.query("DELETE FROM public.location_verifications WHERE player_id=$1", [userId]);
    await client.query("DELETE FROM public.player_cards WHERE player_id=$1", [userId]);
    // Auth's dependent identities and sessions are removed by its foreign keys.
    // Keep this in the same transaction: unexpected dependencies roll back everything.
    await client.query("DELETE FROM auth.users WHERE id=$1", [userId]);
  });
}
