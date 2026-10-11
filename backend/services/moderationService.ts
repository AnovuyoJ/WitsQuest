import { database, transaction } from "./database";

export type EventType =
  | 'location_anomaly'
  | 'duplicate_submission'
  | 'suspicious_round_pattern'
  | 'frequent_forfeit'
  | 'rapid_game_creation';

const EVENT_SEVERITY: Record<EventType, number> = {
  location_anomaly: 3,
  duplicate_submission: 2,
  suspicious_round_pattern: 3,
  frequent_forfeit: 2,
  rapid_game_creation: 1,
};

/**
 * Logs a trust anomaly and dynamically updates the player's trust score and status.
 */
export async function recordTrustEvent(
  playerId: string,
  eventType: EventType,
  metadata: Record<string, unknown> = {}
) {
  const severity = EVENT_SEVERITY[eventType] || 1;
  return transaction(async client => {
    await client.query(`INSERT INTO public.trust_events (player_id,event_type,severity,metadata)
      VALUES ($1,$2,$3,$4)`, [playerId,eventType,severity,JSON.stringify(metadata)]);
    const existing = (await client.query(`SELECT score FROM public.player_trust_score
      WHERE player_id=$1 FOR UPDATE`, [playerId])).rows[0];
    const newScore = Math.max(0,(existing?.score ?? 100)-severity*5);

    let status: 'normal' | 'watched' | 'restricted' | 'banned' = 'normal';
    if (newScore < 30) status = 'restricted';
    else if (newScore < 70) status = 'watched';

    await client.query(`INSERT INTO public.player_trust_score (player_id,score,status,last_updated_at)
      VALUES ($1,$2,$3,now()) ON CONFLICT (player_id) DO UPDATE
      SET score=EXCLUDED.score,status=EXCLUDED.status,last_updated_at=now()`, [playerId,newScore,status]);

    if (newScore < 60) {
      const openFlag = (await client.query(`SELECT id FROM public.moderation_flags
        WHERE player_id=$1 AND status='open' LIMIT 1`, [playerId])).rows[0];
      if (!openFlag) {
        await client.query(`INSERT INTO public.moderation_flags (player_id,reason,status,action_taken)
          VALUES ($1,$2,'open','none')`,
        [playerId,`Automated System Flag: Trust score fell to ${newScore} after ${eventType}.`]);
      }
    }
    return { score: newScore,status };
  });
}

/**
 * Checks if a player is allowed to engage in competitive matchmaking or events.
 */
export async function getPlayerTrustStatus(playerId: string) {
  const { rows } = await database.query(`SELECT score,status FROM public.player_trust_score WHERE player_id=$1`, [playerId]);
  const data = rows[0];

  return {
    score: data?.score ?? 100,
    status: data?.status ?? 'normal',
    isAllowed: data?.status !== 'restricted' && data?.status !== 'banned',
  };
}