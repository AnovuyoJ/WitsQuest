"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

export type Challenge = {
  id: string; event_id: string; question_text: string;
  question_type: "multiple_choice" | "text" | "true_false";
  options: string[] | null; card_id: string | null;
};
export type ChallengeResult = {
  correct: boolean; correctAnswer: string; alreadyCompleted: boolean; cardAwarded: boolean;
};
type ChallengeState =
  | { status: "loading" }
  | { status: "ready" | "submitting"; challenge: Challenge }
  | { status: "result"; challenge: Challenge; result: ChallengeResult }
  | { status: "error"; message: string };

export function useChallenge(eventId: string) {
  const [state, setState] = useState<ChallengeState>({ status: "loading" });
  const load = useCallback(async () => {
    if (!eventId) { setState({ status: "error", message: "No event was selected." }); return; }
    setState({ status: "loading" });
    const { data, error } = await apiRequest<Challenge>(`/events/${encodeURIComponent(eventId)}/challenge`);
    if (error) setState({ status: "error", message: error.message });
    else if (!data) setState({ status: "error", message: "There are no unanswered questions for this event." });
    else setState({ status: "ready", challenge: data });
  }, [eventId]);
  useEffect(() => { void load(); }, [load]);

  async function submit(answer: string) {
    if (state.status !== "ready" || !answer.trim()) return;
    const challenge = state.challenge;
    setState({ status: "submitting", challenge });
    const { data, error } = await apiRequest<ChallengeResult>(`/events/${encodeURIComponent(eventId)}/submit-answer`, "POST", {
      challengeId: challenge.id, answer,
    });
    if (error || !data) setState({ status: "error", message: error?.message || "Could not submit answer." });
    else setState({ status: "result", challenge, result: data });
  }
  return { state, submit, reload: load, nextQuestion: load };
}
