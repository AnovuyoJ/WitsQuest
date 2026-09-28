"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";
import { supabase } from "./supabaseClient";
import { cacheChallenge, getCachedChallenge, queueOfflineAttempt } from "./offlineDb";

export type Challenge = {
  id: string;
  event_id: string;
  question_text: string;
  question_type: "multiple_choice" | "text" | "true_false";
  options: string[] | null;
  card_id: string | null;
  offline_token: string;
  offline_expires_at: string;
};

export type ChallengeResult = {
  correct: boolean; correctAnswer: string; alreadyCompleted: boolean; cardAwarded: boolean;
};

type ChallengeState =
  | { status: "loading" }
  | { status: "ready" | "submitting"; challenge: Challenge }
  | { status: "result"; challenge: Challenge; result: ChallengeResult }
  | { status: "queued"; challenge: Challenge }
  | { status: "error"; message: string };

async function currentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user.id;
}

export function useChallenge(eventId: string) {
  const [state, setState] = useState<ChallengeState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!eventId) { setState({ status: "error", message: "No event was selected." }); return; }
    setState({ status: "loading" });
    const ownerId = await currentUserId();
    if (!ownerId) { setState({ status: "error", message: "Sign in again before opening this challenge." }); return; }

    if (!navigator.onLine) {
      const cached = await getCachedChallenge(ownerId, eventId);
      if (!cached) setState({ status: "error", message: "This challenge isn't available offline yet. Connect and try again." });
      else if (new Date(cached.offline_expires_at).getTime() < Date.now()) setState({ status: "error", message: "This offline challenge window has expired. Reconnect to verify your location again." });
      else setState({ status: "ready", challenge: cached });
      return;
    }

    const { data, error } = await apiRequest<Challenge>(`/events/${encodeURIComponent(eventId)}/challenge`);
    if (error) {
      const cached = await getCachedChallenge(ownerId, eventId);
      if (cached && new Date(cached.offline_expires_at).getTime() >= Date.now()) setState({ status: "ready", challenge: cached });
      else setState({ status: "error", message: error.message });
      return;
    }
    if (!data) { setState({ status: "error", message: "There are no unanswered questions for this event." }); return; }

    setState({ status: "ready", challenge: data });
    await cacheChallenge(ownerId, data);
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function saveOffline(challenge: Challenge, answer: string, ownerId: string) {
    if (new Date(challenge.offline_expires_at).getTime() < Date.now()) {
      setState({ status: "error", message: "The 15-minute offline answer window has expired. Reconnect to continue." });
      return;
    }
    await queueOfflineAttempt({
      id: crypto.randomUUID(),
      ownerId,
      eventId,
      challengeId: challenge.id,
      answer,
      attemptedAt: new Date().toISOString(),
      offlineToken: challenge.offline_token,
    });
    setState({ status: "queued", challenge });
  }

  async function submit(answer: string) {
    if (state.status !== "ready" || !answer.trim()) return;
    const challenge = state.challenge;
    const ownerId = await currentUserId();
    if (!ownerId) { setState({ status: "error", message: "Sign in again before saving this answer." }); return; }

    if (!navigator.onLine) {
      await saveOffline(challenge, answer, ownerId);
      return;
    }

    setState({ status: "submitting", challenge });
    const { data, error } = await apiRequest<ChallengeResult>(`/events/${encodeURIComponent(eventId)}/submit-answer`, "POST", {
      challengeId: challenge.id,
      answer,
    });
    // The browser may still consider a device "online" while localhost is
    // reachable but Supabase is not. Keep the answer in that case too.
    if (error && (error.status === undefined || error.code === "AUTH_UNAVAILABLE")) {
      await saveOffline(challenge, answer, ownerId);
    } else if (error || !data) {
      setState({ status: "error", message: error?.message || "Could not submit answer." });
    } else setState({ status: "result", challenge, result: data });
  }

  return { state, submit, reload: load, nextQuestion: load };
}
