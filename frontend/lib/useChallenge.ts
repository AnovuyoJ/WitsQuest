"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";
import {
  cacheChallenge,
  getCachedChallenge,
  queueOfflineAttempt,
} from "./offlineDb";

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
  // Shown when an answer was recorded locally because we're offline.
  // There's no result yet — it'll be checked once we're back online.
  | { status: "queued"; challenge: Challenge }
  | { status: "error"; message: string };

export function useChallenge(eventId: string) {
  const [state, setState] = useState<ChallengeState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!eventId) { setState({ status: "error", message: "No event was selected." }); return; }
    setState({ status: "loading" });

    if (!navigator.onLine) {
      const cached = await getCachedChallenge(eventId);
      if (cached) setState({ status: "ready", challenge: cached });
      else setState({ status: "error", message: "This challenge isn't available offline yet. Connect and try again." });
      return;
    }

    const { data, error } = await apiRequest<Challenge>(`/events/${encodeURIComponent(eventId)}/challenge`);

    if (error) {
      // Network request failed even though we think we're online (e.g. flaky
      // signal) — fall back to a cached copy if we have one.
      const cached = await getCachedChallenge(eventId);
      if (cached) setState({ status: "ready", challenge: cached });
      else setState({ status: "error", message: error.message });
      return;
    }

    if (!data) {
      setState({ status: "error", message: "There are no unanswered questions for this event." });
      return;
    }

    setState({ status: "ready", challenge: data });
    cacheChallenge(data);
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(answer: string) {
    if (state.status !== "ready" || !answer.trim()) return;
    const challenge = state.challenge;

    if (!navigator.onLine) {
      // Can't reach the server — record the attempt locally with the
      // current time and location, to be validated once we're back online.
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // No location available — the sync-time validation will need to
          // handle a missing location gracefully.
        }
      }

      await queueOfflineAttempt({
        id: crypto.randomUUID(),
        eventId,
        challengeId: challenge.id,
        answer,
        attemptedAt: new Date().toISOString(),
        latitude,
        longitude,
      });

      setState({ status: "queued", challenge });
      return;
    }

    setState({ status: "submitting", challenge });
    const { data, error } = await apiRequest<ChallengeResult>(`/events/${encodeURIComponent(eventId)}/submit-answer`, "POST", {
      challengeId: challenge.id, answer,
    });
    if (error || !data) setState({ status: "error", message: error?.message || "Could not submit answer." });
    else setState({ status: "result", challenge, result: data });
  }

  return { state, submit, reload: load, nextQuestion: load };
}
