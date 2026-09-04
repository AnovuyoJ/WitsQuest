import { supabaseAdmin } from "./supabaseAdminClient";

export type SubmitAnswerResult =
  | { outcome: "no-verification" }
  | { outcome: "already-answered"; correctAnswer: string; wasCorrect: boolean }
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
 * - A player can only attempt each event's challenge once — enforced via
 *   challenge_attempts, independently of whether a card exists to award
 * - A correct answer awards the card exactly once (only when card_id is set)
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

  // 3. Check if this player has already attempted this event's challenge —
  // this is the real "once only" gate, independent of card availability.
  const { data: existingAttempt } = await supabaseAdmin
    .from("challenge_attempts")
    .select("correct")
    .eq("player_id", playerId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingAttempt) {
    return {
      outcome: "already-answered",
      correctAnswer: challenge.correct_answer,
      wasCorrect: existingAttempt.correct,
    };
  }

  const isCorrect = normalize(submittedAnswer) === normalize(challenge.correct_answer);

  // 4. Record the attempt (correct or not) — this is what blocks replays.
  // The unique constraint on (player_id, event_id) also protects against
  // two near-simultaneous requests both slipping through.
  const { error: attemptError } = await supabaseAdmin.from("challenge_attempts").insert({
    player_id: playerId,
    event_id: eventId,
    correct: isCorrect,
  });

  if (attemptError) {
    // Someone else's request won the race and inserted first — treat this
    // as already answered rather than awarding twice.
    return {
      outcome: "already-answered",
      correctAnswer: challenge.correct_answer,
      wasCorrect: isCorrect,
    };
  }

  // 5. Award the card only on a correct answer, and only if a card exists yet
  let cardAwarded = false;

  if (isCorrect && challenge.card_id) {
    const { error: insertError } = await supabaseAdmin.from("player_cards").insert({
      player_id: playerId,
      event_id: eventId,
      card_id: challenge.card_id,
    });

    if (insertError) {
      throw new Error(`Could not award card: ${insertError.message}`);
    }

    cardAwarded = true;
  }

  return {
    outcome: "answered",
    correct: isCorrect,
    correctAnswer: challenge.correct_answer,
    cardAwarded,
  };
}
