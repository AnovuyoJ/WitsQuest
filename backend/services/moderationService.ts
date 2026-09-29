import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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

  // 1. Log event
  await supabase.from('trust_events').insert({
    player_id: playerId,
    event_type: eventType,
    severity,
    metadata,
  });

  // 2. Fetch or initialize current trust score
  const { data: existing } = await supabase
    .from('player_trust_score')
    .select('score, status')
    .eq('player_id', playerId)
    .maybeSingle();

  const currentScore = existing?.score ?? 100;
  const penalty = severity * 5;
  const newScore = Math.max(0, currentScore - penalty);

  // Determine status tier based on score
  let status: 'normal' | 'watched' | 'restricted' | 'banned' = 'normal';
  if (newScore < 30) status = 'restricted';
  else if (newScore < 70) status = 'watched';

  // 3. Upsert new score
  await supabase.from('player_trust_score').upsert({
    player_id: playerId,
    score: newScore,
    status,
    last_updated_at: new Date().toISOString(),
  });

  // 4. Create an open flag for admin review if trust drops below critical threshold
  if (newScore < 60) {
    const { data: existingFlag } = await supabase
      .from('moderation_flags')
      .select('id')
      .eq('player_id', playerId)
      .eq('status', 'open')
      .maybeSingle();

    if (!existingFlag) {
      await supabase.from('moderation_flags').insert({
        player_id: playerId,
        reason: `Automated System Flag: Trust score fell to ${newScore} after ${eventType}.`,
        status: 'open',
        action_taken: 'none',
      });
    }
  }

  return { score: newScore, status };
}

/**
 * Checks if a player is allowed to engage in competitive matchmaking or events.
 */
export async function getPlayerTrustStatus(playerId: string) {
  const { data } = await supabase
    .from('player_trust_score')
    .select('score, status')
    .eq('player_id', playerId)
    .maybeSingle();

  return {
    score: data?.score ?? 100,
    status: data?.status ?? 'normal',
    isAllowed: data?.status !== 'restricted' && data?.status !== 'banned',
  };
}