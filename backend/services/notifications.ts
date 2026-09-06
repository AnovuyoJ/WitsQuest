import { PoolClient } from "pg";

export async function notifyGamePlayers(client: PoolClient, game: { id: string; player_one_id: string; player_two_id: string | null }, title: string, message: string) {
  await client.query(`INSERT INTO public.notifications (user_id,title,message,href)
    SELECT player_id,$2,$3,$4 FROM unnest($1::uuid[]) AS player_id WHERE player_id IS NOT NULL`,
    [[game.player_one_id,game.player_two_id],title,message,`/dashboard/games/${game.id}`]);
}
