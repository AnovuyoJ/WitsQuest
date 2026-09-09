import { PoolClient } from "pg";
import { transaction } from "./database";
import { HttpError } from "./validation";

export async function requireVerifiedEvent(client: PoolClient, playerId: string, eventId: string) {
  const event = await client.query(`SELECT id FROM public.live_events WHERE id=$1 AND starts_at <= now() AND ends_at >= now()`, [eventId]);
  if (!event.rowCount) throw new HttpError(410, "This event is not currently active.");
  const verification = await client.query(`SELECT id FROM public.location_verifications
    WHERE player_id=$1 AND event_id=$2 AND verified_at >= now() - interval '15 minutes' LIMIT 1`, [playerId, eventId]);
  if (!verification.rowCount) throw new HttpError(403, "Verify your location at this event before answering.");
}

export async function loadChallenge(playerId: string, eventId: string) {
  return transaction(async client => {
    await requireVerifiedEvent(client, playerId, eventId);
    const { rows } = await client.query(`SELECT c.id,c.event_id,c.question_text,c.question_type,c.options,c.card_id
      FROM public.live_challenges c WHERE c.event_id=$1 AND NOT EXISTS (
        SELECT 1 FROM public.challenge_attempts a WHERE a.challenge_id=c.id AND a.player_id=$2
      ) ORDER BY c.created_at,c.id LIMIT 1`, [eventId, playerId]);
    return rows[0] ?? null;
  });
}

export async function submitAnswer(playerId: string, eventId: string, challengeId: string, answer: string) {
  return transaction(async client => {
    await requireVerifiedEvent(client, playerId, eventId);
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [playerId]);
    const challenge = (await client.query(`SELECT id,correct_answer,card_id FROM public.live_challenges
      WHERE id=$1 AND event_id=$2 FOR SHARE`, [challengeId, eventId])).rows[0];
    if (!challenge) throw new HttpError(404, "Challenge not found for this event.");
    const attempt = (await client.query(`SELECT correct FROM public.challenge_attempts
      WHERE player_id=$1 AND challenge_id=$2`, [playerId, challengeId])).rows[0];
    if (attempt) return { correct: attempt.correct, correctAnswer: challenge.correct_answer, alreadyCompleted: true, cardAwarded: false };
    const correct = answer.trim().toLowerCase() === challenge.correct_answer.trim().toLowerCase();
    await client.query(`INSERT INTO public.challenge_attempts (player_id,event_id,challenge_id,correct)
      VALUES ($1,$2,$3,$4)`, [playerId,eventId,challengeId,correct]);
    let cardAwarded = false;
    if (correct && challenge.card_id) {
      const award = await client.query(`INSERT INTO public.player_cards (player_id,event_id,card_id)
        VALUES ($1,$2,$3) RETURNING id`, [playerId,eventId,challenge.card_id]);
      cardAwarded = Boolean(award.rowCount);
    }
    return { correct, correctAnswer: challenge.correct_answer, alreadyCompleted: false, cardAwarded };
  });
}
