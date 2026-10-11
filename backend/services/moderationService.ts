import { database, transaction } from "./database";
import { HttpError } from "./validation";

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

export async function recordTrustEventInTx(
  client: import("pg").PoolClient,
  playerId: string,
  eventType: EventType,
  metadata: Record<string, unknown> = {},
) {
  const severity = EVENT_SEVERITY[eventType] || 1;
  await client.query(`INSERT INTO public.trust_events (player_id,event_type,severity,metadata)
    VALUES ($1,$2,$3,$4)`, [playerId,eventType,severity,JSON.stringify(metadata)]);
  const existing = (await client.query(`SELECT score FROM public.player_trust_score
    WHERE player_id=$1 FOR UPDATE`, [playerId])).rows[0];
  const newScore = Math.max(0,(existing?.score ?? 100)-severity*5);

  let status: 'normal' | 'watched' | 'restricted' | 'banned' = 'normal';
  let restrictionMinutes: number | null = null;
  if (newScore < 30) {
    status = 'restricted';
    restrictionMinutes = 60;
  } else if (newScore < 70) {
    status = 'watched';
    restrictionMinutes = 5;
  }

  await client.query(`INSERT INTO public.player_trust_score (player_id,score,status,restricted_until,last_updated_at)
    VALUES ($1,$2,$3,CASE WHEN $4::integer IS NULL THEN NULL ELSE now()+($4::text || ' minutes')::interval END,now())
    ON CONFLICT (player_id) DO UPDATE SET score=EXCLUDED.score,status=EXCLUDED.status,
      restricted_until=EXCLUDED.restricted_until,last_updated_at=now()`,
  [playerId,newScore,status,restrictionMinutes]);

  if (newScore < 60) {
    const openFlag = (await client.query(`SELECT id FROM public.moderation_flags
      WHERE player_id=$1 AND status='open' LIMIT 1`, [playerId])).rows[0];
    if (!openFlag) {
      await client.query(`INSERT INTO public.moderation_flags (player_id,reason,status,action_taken)
        VALUES ($1,$2,'open','none')`,
      [playerId,`Automated system flag: trust score fell to ${newScore} after ${eventType}.`]);
    }
  }
  return { score: newScore,status,restrictionMinutes };
}

export async function recordRepeatedOpponentPatternInTx(
  client: import("pg").PoolClient,
  playerId: string,
  opponentId: string,
) {
  const counts = (await client.query(`SELECT count(*)::int AS total,
    count(*) FILTER (WHERE opponent_id=$2)::int AS paired FROM (
      SELECT CASE WHEN player_one_id=$1 THEN player_two_id ELSE player_one_id END AS opponent_id
      FROM public.card_games WHERE status='finished' AND rules_version=2 AND is_cpu=false
        AND (player_one_id=$1 OR player_two_id=$1)
    ) completed`, [playerId,opponentId])).rows[0];
  if (counts.total < 5 || counts.paired / counts.total < 0.8) return null;
  const existing = (await client.query(`SELECT id FROM public.trust_events WHERE player_id=$1
    AND event_type='suspicious_round_pattern' AND metadata->>'opponentId'=$2 LIMIT 1`, [playerId,opponentId])).rows[0];
  if (existing) return null;
  return recordTrustEventInTx(client,playerId,"suspicious_round_pattern",{ opponentId,totalMatches:counts.total,pairedMatches:counts.paired });
}

export async function recordFrequentForfeitInTx(client: import("pg").PoolClient, playerId: string) {
  const count = (await client.query(`SELECT count(*)::int AS count FROM public.card_games
    WHERE forfeit_by=$1 AND is_cpu=false AND finished_at>=now()-interval '30 days'`, [playerId])).rows[0].count;
  if (count < 3) return null;
  const existing = (await client.query(`SELECT id FROM public.trust_events WHERE player_id=$1
    AND event_type='frequent_forfeit' AND created_at>=now()-interval '30 days' LIMIT 1`, [playerId])).rows[0];
  if (existing) return null;
  return recordTrustEventInTx(client,playerId,"frequent_forfeit",{ forfeitsInLast30Days:count });
}

/**
 * Logs a trust anomaly and dynamically updates the player's trust score and status.
 */
export async function recordTrustEvent(
  playerId: string,
  eventType: EventType,
  metadata: Record<string, unknown> = {}
) {
  return transaction(client => recordTrustEventInTx(client,playerId,eventType,metadata));
}

export async function enforcePlayerTrust(client: import("pg").PoolClient, playerId: string) {
  const row = (await client.query(`SELECT score,status,restricted_until FROM public.player_trust_score
    WHERE player_id=$1 FOR UPDATE`, [playerId])).rows[0];
  if (!row || row.status === 'normal') return;
  if (row.status === 'banned') {
    throw new HttpError(403,"Your account is banned from competitive actions.");
  }
  if (row.restricted_until && new Date(row.restricted_until).getTime() <= Date.now()) {
    const nextStatus = row.score < 70 ? 'watched' : 'normal';
    await client.query(`UPDATE public.player_trust_score SET status=$2,restricted_until=NULL,last_updated_at=now()
      WHERE player_id=$1`, [playerId,nextStatus]);
    return;
  }
  if ((row.status === 'restricted' && !row.restricted_until) || row.restricted_until) {
    throw new HttpError(403,"Your account is temporarily restricted from this action. Try again after the restriction expires or contact a moderator.");
  }
}

/**
 * Checks if a player is allowed to engage in competitive matchmaking or events.
 */
export async function getPlayerTrustStatus(playerId: string) {
  const { rows } = await database.query(`SELECT score,
    CASE WHEN restricted_until IS NOT NULL AND restricted_until<=now() AND status IN ('watched','restricted')
      THEN CASE WHEN score<70 THEN 'watched' ELSE 'normal' END ELSE status END AS status
    FROM public.player_trust_score WHERE player_id=$1`, [playerId]);
  const data = rows[0];

  return {
    score: data?.score ?? 100,
    status: data?.status ?? 'normal',
    isAllowed: data?.status !== 'restricted' && data?.status !== 'banned',
  };
}