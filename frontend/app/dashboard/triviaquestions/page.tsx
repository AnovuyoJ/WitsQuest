"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TriviaDeck from "@/components/TriviaDeck";
import { loadSavedChallenges } from "@/lib/adminChallenges";

function TriviaQuestionsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";

  const challenge = useMemo(() => {
    const savedChallenges = loadSavedChallenges();

    return savedChallenges.find((item) => item.id === eventId) ?? null;
  }, [eventId]);

  if (!challenge) {
    return (
      <div className="p-6 text-sm text-slate-500">
        This event does not have a saved challenge question yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-2xl tracking-tight text-[#043673]">
            Challenge question
          </h1>

          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C9A24B]">
            Wits Quest
          </span>
        </div>

        <div className="h-[3px] w-14 rounded-full bg-gradient-to-r from-[#043673] to-[#C9A24B]" />
      </header>

      <TriviaDeck
        eventId={challenge.id}
        eventTitle={challenge.title}
        eventLocation={challenge.location}
        question={{
          id: challenge.id,
          prompt: challenge.question,
          options: challenge.options,
          answer: challenge.answer,
          explanation: `${challenge.title} challenge: ${challenge.description}`,
          difficulty: challenge.difficulty,
          points: challenge.points,
        }}
      />
    </div>
  );
}

export default function TriviaQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-500">
          Loading challenge...
        </div>
      }
    >
      <TriviaQuestionsContent />
    </Suspense>
  );
}