import { supabaseAdmin } from "./supabaseAdminClient";

export type SubmitAnswerResult =
  | { outcome: "no-verification" }
  | { outcome: "already-awarded"; correctAnswer: string; wasCorrect: boolean }
  | { outcome: "answered"; correct: boolean; correctAnswer: string; cardAwarded: boolean };

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Handles a player's answer submission for an event's challenge.
 *
 * Rules enforced here:
 * - Player must have already passed location verification for this event
 * - The game (not the player's device) decides correctness
 * - A correct answer awards the card exactly once, even on repeat attempts
 */
export async function submitAnswer(
  playerId: string,
  eventId: string,
  submittedAnswer: string
): Promise<SubmitAnswerResult> {
  // 1. Confirm the player actually passed location verification for this event
  const { data: verification } = await supabaseAdmin
    .from("location_verifications")
    .select("id")
    .eq("player_id", playerId)
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (!verification) {
    return { outcome: "no-verification" };
  }

  // 2. Look up the challenge tied to this event
  const { data: challenge, error: challengeError } = await supabaseAdmin
    .from("challenges")
    .select("id, correct_answer, card_id")
    .eq("event_id", eventId)
    .single();

  if (challengeError || !challenge) {
    throw new Error("No challenge found for this event.");
  }

  // 3. If the player already has a card from this event, don't re-award —
  // just tell them what happened, without changing anything.
  const { data: existingCard } = await supabaseAdmin
    .from("player_cards")
    .select("id")
    .eq("player_id", playerId)
    .eq("event_id", eventId)
    .maybeSingle();

  const isCorrect = normalize(submittedAnswer) === normalize(challenge.correct_answer);

  if (existingCard) {
    return {
      outcome: "already-awarded",
      correctAnswer: challenge.correct_answer,
      wasCorrect: isCorrect,
    };
  }

  // 4. Award the card only on a correct, first-time answer
  let cardAwarded = false;

  if (isCorrect && challenge.card_id) {
    const { error: insertError } = await supabaseAdmin.from("player_cards").insert({
      player_id: playerId,
      event_id: eventId,
      card_id: challenge.card_id,
    });

    // Unique constraint (player_id, event_id) protects against a race
    // condition where two requests land at nearly the same time.
    cardAwarded = !insertError;
  }

  return {
    outcome: "answered",
    correct: isCorrect,
    correctAnswer: challenge.correct_answer,
    cardAwarded,
  };
}