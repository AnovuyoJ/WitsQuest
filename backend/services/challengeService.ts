import { PoolClient } from "pg";
import { transaction } from "./database";
import { HttpError } from "./validation";

const OFFLINE_WINDOW_MINUTES = 15;
const SYNC_GRACE_HOURS = 24;

export async function requireVerifiedEvent(
  client: PoolClient,
  playerId: string,
  eventId: string,
  attemptedAt: Date = new Date(),
) {
  const event = await client.query(
    `SELECT id FROM public.live_events WHERE id=$1 AND starts_at <= $2 AND ends_at >= $2`,
    [eventId, attemptedAt],
  );
  if (!event.rowCount) throw new HttpError(410, "This event was not active at the time of this attempt.");

  const verification = await client.query(
    `SELECT id,verified_at FROM public.location_verifications
     WHERE player_id=$1 AND event_id=$2 AND flagged=false
       AND verified_at <= $3
       AND verified_at >= $3::timestamptz - interval '15 minutes'
     ORDER BY verified_at DESC LIMIT 1`,
    [playerId, eventId, attemptedAt],
  );
  if (!verification.rowCount) throw new HttpError(403, "Verify your location at this event before answering.");
  return verification.rows[0];
}

export async function loadChallenge(playerId: string, eventId: string) {
  return transaction(async (client) => {
    const verification = await requireVerifiedEvent(client, playerId, eventId);
    const challenge = (await client.query(`SELECT live.id,live.event_id,live.question_text,live.question_type,
        live.options,live.card_id,live.correct_answer,source.published_revision
      FROM public.live_challenges live JOIN public.challenges source ON source.id=live.id
      WHERE live.event_id=$1 AND NOT EXISTS (
        SELECT 1 FROM public.challenge_attempts attempt
        WHERE attempt.challenge_id=live.id AND attempt.player_id=$2
      ) ORDER BY live.created_at,live.id LIMIT 1`, [eventId, playerId])).rows[0];
    if (!challenge) return null;

    const lease = (await client.query(`INSERT INTO public.offline_attempt_sessions
      (player_id,event_id,challenge_id,verification_id,challenge_revision,correct_answer_snapshot,
       card_id_snapshot,expires_at,sync_deadline)
      VALUES ($1,$2,$3,$4,$5,$6,$7,
        now()+($8 || ' minutes')::interval,
        now()+($8 || ' minutes')::interval+($9 || ' hours')::interval)
      RETURNING id,expires_at`, [playerId,eventId,challenge.id,verification.id,challenge.published_revision,
      challenge.correct_answer,challenge.card_id,OFFLINE_WINDOW_MINUTES,SYNC_GRACE_HOURS])).rows[0];

    return {
      id: challenge.id,
      event_id: challenge.event_id,
      question_text: challenge.question_text,
      question_type: challenge.question_type,
      options: challenge.options,
      card_id: challenge.card_id,
      offline_token: lease.id,
      offline_expires_at: lease.expires_at,
    };
  });
}

function parseAttemptedAt(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw new HttpError(400, "Attempt timestamp is invalid.");
  if (date.getTime() > Date.now() + 5_000) throw new HttpError(400, "Attempt timestamp cannot be in the future.");
  return date;
}

async function saveAttempt(
  client: PoolClient,
  playerId: string,
  eventId: string,
  challengeId: string,
  answer: string,
  attemptedAt: Date,
  correctAnswer: string,
  cardId: string | null,
) {
  const existing = (await client.query(`SELECT correct FROM public.challenge_attempts
    WHERE player_id=$1 AND challenge_id=$2`, [playerId, challengeId])).rows[0];
  if (existing) return { correct: existing.correct, correctAnswer, alreadyCompleted: true, cardAwarded: false };

  const correct = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  await client.query(`INSERT INTO public.challenge_attempts (player_id,event_id,challenge_id,correct,answered_at)
    VALUES ($1,$2,$3,$4,$5)`, [playerId,eventId,challengeId,correct,attemptedAt]);
  let cardAwarded = false;
  if (correct && cardId) {
    const award = await client.query(`INSERT INTO public.player_cards (player_id,event_id,card_id)
      VALUES ($1,$2,$3) RETURNING id`, [playerId,eventId,cardId]);
    cardAwarded = Boolean(award.rowCount);
  }
  return { correct, correctAnswer, alreadyCompleted: false, cardAwarded };
}

export async function submitAnswer(
  playerId: string,
  eventId: string,
  challengeId: string,
  answer: string,
  attemptedAt?: string,
  offlineToken?: string,
  clientAttemptId?: string,
) {
  const isOfflineAttempt = offlineToken !== undefined || attemptedAt !== undefined || clientAttemptId !== undefined;
  if (isOfflineAttempt && (!offlineToken || !attemptedAt || !clientAttemptId)) {
    throw new HttpError(400, "Offline attempts require a token, timestamp and attempt ID.");
  }
  const effectiveAttemptedAt = parseAttemptedAt(attemptedAt);

  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [playerId]);

    if (isOfflineAttempt) {
      const lease = (await client.query(`SELECT * FROM public.offline_attempt_sessions
        WHERE id=$1 AND player_id=$2 AND event_id=$3 AND challenge_id=$4 FOR UPDATE`,
      [offlineToken,playerId,eventId,challengeId])).rows[0];
      if (!lease) throw new HttpError(403, "This offline attempt token is not valid for this player or challenge.");

      if (lease.client_attempt_id && String(lease.client_attempt_id) !== clientAttemptId) {
        throw new HttpError(409, "This offline attempt token has already been used.");
      }
      if (new Date(lease.sync_deadline).getTime() < Date.now()) {
        throw new HttpError(410, "This offline attempt is too old to synchronize.");
      }
      const attemptTime = effectiveAttemptedAt.getTime();
      if (attemptTime < new Date(lease.issued_at).getTime() || attemptTime > new Date(lease.expires_at).getTime()) {
        throw new HttpError(410, "The answer was recorded outside its offline attempt window.");
      }

      const result = await saveAttempt(client,playerId,eventId,challengeId,answer,effectiveAttemptedAt,
        String(lease.correct_answer_snapshot),lease.card_id_snapshot ? String(lease.card_id_snapshot) : null);
      await client.query(`UPDATE public.offline_attempt_sessions
        SET consumed_at=COALESCE(consumed_at,now()),client_attempt_id=COALESCE(client_attempt_id,$1)
        WHERE id=$2`, [clientAttemptId,offlineToken]);
      return result;
    }

    await requireVerifiedEvent(client,playerId,eventId,effectiveAttemptedAt);
    const challenge = (await client.query(`SELECT id,correct_answer,card_id FROM public.live_challenges
      WHERE id=$1 AND event_id=$2 FOR SHARE`, [challengeId,eventId])).rows[0];
    if (!challenge) throw new HttpError(404, "Challenge not found for this event.");
    return saveAttempt(client,playerId,eventId,challengeId,answer,effectiveAttemptedAt,
      String(challenge.correct_answer),challenge.card_id ? String(challenge.card_id) : null);
  });
}
