"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Challenge = {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "text" | "true_false";
  options: string[] | null;
};

type SubmitResult = {
  correct: boolean;
  correctAnswer: string;
  cardAwarded: boolean;
  alreadyCompleted: boolean;
};

type ChallengeState =
  | { status: "loading" }
  | { status: "ready"; challenge: Challenge }
  | { status: "submitting"; challenge: Challenge }
  | { status: "result"; challenge: Challenge; result: SubmitResult }
  | { status: "error"; message: string };

export function useChallenge(eventId: string) {
  const [state, setState] = useState<ChallengeState>({ status: "loading" });

  useEffect(() => {
    async function loadChallenge() {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, question_text, question_type, options")
        .eq("event_id", eventId)
        .single();

      if (error || !data) {
        setState({ status: "error", message: "No challenge found for this event." });
        return;
      }

      setState({ status: "ready", challenge: data as Challenge });
    }

    loadChallenge();
  }, [eventId]);

  async function submit(answer: string) {
    if (state.status !== "ready") return;

    setState({ status: "submitting", challenge: state.challenge });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState({ status: "error", message: "You need to be signed in to answer." });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/submit-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ answer }),
        }
      );

      const body = await res.json();

      if (res.status === 403) {
        setState({
          status: "error",
          message: "You need to verify your location at this event before answering.",
        });
        return;
      }

      if (!res.ok) {
        setState({ status: "error", message: body.message || "Something went wrong." });
        return;
      }

      setState({
        status: "result",
        challenge: state.challenge,
        result: {
          correct: body.correct,
          correctAnswer: body.correctAnswer,
          cardAwarded: body.cardAwarded,
          alreadyCompleted: body.alreadyCompleted,
        },
      });
    } catch {
      setState({ status: "error", message: "Could not reach the server. Try again." });
    }
  }

  return { state, submit };
}