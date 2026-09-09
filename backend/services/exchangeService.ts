import { database, transaction } from "./database";
import { HttpError } from "./validation";

// Only published event rewards are offered; unpublished admin drafts stay private.
const availableTargets = `SELECT c.* FROM public.cards c WHERE c.event_id=$2 AND c.rarity=$3
  AND c.points BETWEEN 0 AND 100
  AND NOT EXISTS (SELECT 1 FROM public.player_cards pc WHERE pc.player_id=$1 AND pc.card_id=c.id)
  AND EXISTS (SELECT 1 FROM public.live_challenges ch JOIN public.live_events e ON e.id=ch.event_id
    WHERE ch.card_id=c.id AND ch.event_id=c.event_id)`;

export async function exchangeOptions(playerId: string, sourceId: string) {
  const source = (await database.query(`SELECT c.*,e.title AS event_title,
    (SELECT count(*)::int FROM public.player_cards pc WHERE pc.player_id=$1 AND pc.card_id=c.id) AS owned
    FROM public.cards c LEFT JOIN public.live_events e ON e.id=c.event_id WHERE c.id=$2`, [playerId,sourceId])).rows[0];
  if (!source || !source.owned) throw new HttpError(404, "Owned card not found.");
  const targets = (await database.query(availableTargets + " ORDER BY c.title,c.id", [playerId,source.event_id,source.rarity])).rows;
  return { owned: source.owned, extras: Math.max(0,source.owned-1), event_title: source.event_title ?? "Original event", targets };
}

export async function exchangeCards(playerId: string, sourceId: string, targetId: string) {
  return transaction(async client => {
    // Same player lock as challenge awards: concurrent exchanges cannot spend copies twice
    // or grant a target which a simultaneous challenge award has already given the player.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [playerId]);
    const source = (await client.query("SELECT * FROM public.cards WHERE id=$1 FOR SHARE", [sourceId])).rows[0];
    if (!source) throw new HttpError(404, "Owned card not found.");
    const copies = (await client.query(`SELECT id FROM public.player_cards WHERE player_id=$1 AND card_id=$2
      ORDER BY awarded_at NULLS LAST,id FOR UPDATE`, [playerId,sourceId])).rows;
    if (copies.length < 4) throw new HttpError(409, "You need your original card plus three extra copies to exchange.");
    const target = (await client.query(availableTargets + " AND c.id=$4 FOR SHARE OF c", [playerId,source.event_id,source.rarity,targetId])).rows[0];
    if (!target) throw new HttpError(409, "Choose an unowned published reward of the same rarity from the same event.");
    await client.query("DELETE FROM public.player_cards WHERE player_id=$1 AND id=ANY($2::uuid[])", [playerId,copies.slice(1,4).map(copy => copy.id)]);
    await client.query("INSERT INTO public.player_cards (player_id,event_id,card_id) VALUES ($1,$2,$3)", [playerId,source.event_id,targetId]);
    return { card: target, consumed: 3, remaining: copies.length-3 };
  });
}
