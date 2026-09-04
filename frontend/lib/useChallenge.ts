"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabaseClient";
import next from "next";

export type Challenge = {
  id: string;
  event_id: string;
  question_text: string;
  question_type:
    | "multiple_choice"
    | "text"
    | "true_false";
  options: string[] | null;
  correct_answer: string;
  card_id: string | null;
};

export type ChallengeResult = {
  correct: boolean;
  correctAnswer: string;
  alreadyCompleted: boolean;
  cardAwarded: boolean;
};

type ChallengeState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      challenge: Challenge;
    }
  | {
      status: "submitting";
      challenge: Challenge;
    }
  | {
      status: "result";
      challenge: Challenge;
      result: ChallengeResult;
    }
  | {
      status: "error";
      message: string;
    };

export function useChallenge(eventId: string) {
  const [state, setState] =
    useState<ChallengeState>({
      status: "loading",
    });

  /*
   * Find the reward card for this event.
   */
  async function getRewardCard(cardId: string | null) {
    if (!cardId) {
      return null;
    }

    const { data, error } = await supabase
      .from("cards")
      .select("id, event_id, title")
      .eq("id", cardId)
      .maybeSingle();

    if (error) {
      console.error("REWARD CARD LOOKUP ERROR:", error);
      throw error;
    }

    return data;
  }
  /*
   * Check whether this player actually
   * owns the event reward card.
   */
  async function playerOwnsCard(
    playerId: string,
    cardId: string
  ) {
    const { data, error } = await supabase
      .from("player_cards")
      .select("id")
      .eq("player_id", playerId)
      .eq("card_id", cardId)
      .eq("event_id", eventId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "PLAYER CARD CHECK ERROR:",{
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      throw error;
    }
    return Boolean(data);
  }

  /*
   * Award the reward card.
   */
  async function awardCard(playerId: string, cardId: string) {
  const alreadyOwns = await playerOwnsCard(playerId, cardId);

  if (alreadyOwns) {
    return false;
  }

  const { error } = await supabase
    .from("player_cards")
    .insert({
      player_id: playerId,
      event_id: eventId,
      card_id: cardId,
    });

  if (error) {
    // Unique violation just means the card was already awarded
    // (e.g. a race condition) — treat it as "not newly awarded" rather than a hard failure.
    if (error.code === "23505") {
      console.warn("Card already awarded (race condition avoided by constraint).");
      return false;
    }

    console.error("CARD AWARD ERROR:", error);
    throw error;
  }

  console.log("CARD AWARDED SUCCESSFULLY:", { playerId, eventId, cardId });
  return true;
}

  /*
   * Load challenge.
   */
  const loadChallenge =
    useCallback(async () => {
      if (!eventId) {
        setState({
          status: "error",
          message:
            "No event was selected.",
        });

        return;
      }

      setState({
        status: "loading",
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setState({
          status: "error",
          message:
            "You must be signed in to attempt this challenge.",
        });

        return;
      }

      /*
       * Load first challenge for event.
       */
      const {
        data: challengeData,
        error: challengeError,
      } = await supabase
        .from("challenges")
        .select(`
          id,
          event_id,
          question_text,
          question_type,
          options,
          correct_answer,
          card_id
        `)
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (challengeError) {
        console.error(
          "CHALLENGE LOAD ERROR:",
          challengeError
        );

        setState({
          status: "error",
          message:
            challengeError.message,
        });

        return;
      }

      if (!challengeData) {
        setState({
          status: "error",
          message:
            "This event does not have a challenge yet.",
        });

        return;
      }

      const challenge =
        challengeData as Challenge;

      /*
       * Has this player answered correctly before?
       */
      const {
        data: completedAttempts,
        error: completedError,
      } = await supabase
        .from("challenge_attempts")
        .select("id")
        .eq("player_id", user.id)
        .eq("challenge_id", challenge.id)
        .eq("correct", true)
        .limit(1);

      if (completedError) {
        console.error(
          "COMPLETION CHECK ERROR:",
          completedError
        );

        setState({
          status: "error",
          message:
            completedError.message,
        });

        return;
      }

      /*
       * If they previously completed it,
       * make sure they actually received
       * the card.
       */
      if (
        completedAttempts &&
        completedAttempts.length > 0
      ) {
        try {
          const rewardCard =
            await getRewardCard(
              challenge.card_id
            );

          if (!rewardCard) {
            setState({
              status: "result",
              challenge,
              result: {
                correct: true,
                correctAnswer:
                  challenge.correct_answer,
                alreadyCompleted: true,
                cardAwarded: false,
              },
            });

            return;
          }

          const ownsCard =
            await playerOwnsCard(
              user.id,
              rewardCard.id
            );

          /*
           * Completed previously but card
           * was never awarded.
           *
           * Repair that missing award now.
           */
          if (!ownsCard) {
            const awarded =
              await awardCard(
                user.id,
                rewardCard.id
              );

            setState({
              status: "result",
              challenge,
              result: {
                correct: true,
                correctAnswer:
                  challenge.correct_answer,
                alreadyCompleted: true,
                cardAwarded: awarded,
              },
            });

            return;
          }

          setState({
            status: "result",
            challenge,
            result: {
              correct: true,
              correctAnswer:
                challenge.correct_answer,
              alreadyCompleted: true,
              cardAwarded: false,
            },
          });

          return;
        } catch (error) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not check your reward card.",
          });

          return;
        }
      }

      setState({
        status: "ready",
        challenge,
      });
    }, [eventId]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);
  
  const loadNextChallenge = useCallback(async () => {
  if (!eventId) return;

  setState({ status: "loading" });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    setState({
      status: "error",
      message: "You must be signed in to attempt this challenge.",
    });
    return;
  }

  // Get all challenge_ids this player has already attempted for this event
  const { data: attempted, error: attemptedError } = await supabase
    .from("challenge_attempts")
    .select("challenge_id")
    .eq("player_id", user.id)
    .eq("event_id", eventId);

  if (attemptedError) {
    console.error("ATTEMPTED FETCH ERROR:", attemptedError);
    setState({ status: "error", message: attemptedError.message });
    return;
  }

  const attemptedIds = (attempted ?? [])
    .map((a) => a.challenge_id)
    .filter((id): id is string => Boolean(id));

  // Build the query for the next challenge, excluding already-attempted ones
  let query = supabase
    .from("challenges")
    .select(`
      id, event_id, question_text, question_type,
      options, correct_answer, card_id
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (attemptedIds.length > 0) {
    query = query.not("id", "in", `(${attemptedIds.join(",")})`);
  }

  const { data: nextChallenge, error: nextError } = await query.maybeSingle();

  if (nextError) {
    console.error("NEXT CHALLENGE LOAD ERROR:", nextError);
    setState({ status: "error", message: nextError.message });
    return;
  }

  if (!nextChallenge) {
    setState({
      status: "error",
      message: "You've completed all questions for this event!",
    });
    return;
  }

  setState({ status: "ready", challenge: nextChallenge as Challenge });
}, [eventId]);
  /*
   * Submit answer.
   */
  async function submit(submittedAnswer: string) {
    if (state.status !== "ready") {
      return;
    }

    const challenge = state.challenge;
    const answer = submittedAnswer.trim().toLowerCase();
    const expected = challenge.correct_answer.trim().toLowerCase();

    if (!answer) {
      return;
    }

    setState({ status: "submitting", challenge });

    // Get the user FIRST
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setState({ status: "error", message: "You must be signed in." });
      return;
    }

    // Now it's safe to check for an existing attempt
    const { data: existingAttempt, error: existingError } = await supabase
      .from("challenge_attempts")
      .select("id")
      .eq("player_id", user.id)
      .eq("challenge_id", challenge.id)
      .maybeSingle();

    if (existingError) {
      console.error("EXISTING ATTEMPT CHECK ERROR:", existingError);
      setState({
        status: "error",
        message: "Could not verify your attempt status.",
      });
      return;
    }

    if (existingAttempt) {
      setState({
        status: "error",
        message: "You've already attempted this question.",
      });
      return;
    }

    const correct =
      answer === expected;

    /*
     * Wrong answer.
     */
    if (!correct) {
  const { error } = await supabase
    .from("challenge_attempts")
    .insert({
      player_id: user.id,
      event_id: eventId,
      challenge_id: challenge.id,
      correct: false,
    });

  if (error) {
    if (error.code === "23505") {
      setState({
        status: "error",
        message: "You've already attempted this question.",
      });
      return;
    }

    console.error("ATTEMPT INSERT ERROR:", error);
    setState({ status: "error", message: error.message });
    return;
  }

      setState({
        status: "result",
        challenge,
        result: {
          correct: false,
          correctAnswer:
            challenge.correct_answer,
          alreadyCompleted: false,
          cardAwarded: false,
        },
      });

      return;
    }

    /*
     * CORRECT ANSWER
     */
    try {
      const rewardCard =
        await getRewardCard(challenge.card_id);

      if (!rewardCard) {
        console.error(
          "No card exists for event:",
          eventId
        );

        setState({
          status: "error",
          message:
            "Your answer is correct, but this event does not have a reward card yet.",
        });

        return;
      }

      /*
       * Award the card FIRST.
       */
      const cardAwarded =
        await awardCard(
          user.id,
          rewardCard.id
        );

      /*
       * Only after the reward succeeds do
       * we record successful completion.
       */
      const {
        error: attemptError,
      } = await supabase
        .from("challenge_attempts")
        .insert({
          player_id: user.id,
          event_id: eventId,
          challenge_id: challenge.id,
          correct: true,
        });

      if (attemptError) {
        console.error(
          "SUCCESS ATTEMPT ERROR:",
          attemptError
        );
      }

      setState({
        status: "result",
        challenge,
        result: {
          correct: true,
          correctAnswer:
            challenge.correct_answer,
          alreadyCompleted: false,
          cardAwarded,
        },
      });
    } catch (error) {
      console.error(
        "REWARD PROCESS ERROR:",
        error
      );

      setState({
        status: "error",
        message:
          error instanceof Error
            ? `Correct answer, but reward failed: ${error.message}`
            : "Correct answer, but the reward could not be awarded.",
      });
    }
  }

  return {
    state,
    submit,
    reload: loadChallenge,
    nextQuestion: loadNextChallenge,
  };
}
