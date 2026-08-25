"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { awardCollectedCardForChallenge, loadSavedChallenges } from "@/lib/adminChallenges";
import { eventCatalog, type Difficulty, type TriviaQuestion } from "@/lib/trivia";

const WITS_BLUE = "#043673";

const difficultyColors: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700",
};

export default function TriviaDeck({
  eventId,
  eventTitle,
  eventLocation,
  question,
}: {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  question: TriviaQuestion | null;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  if (!question) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_2px_35px_-10px_rgba(4,54,115,0.2)]">
        <p className="text-sm text-slate-500">No challenge question is available for this event yet.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/events")}
          className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: WITS_BLUE }}
        >
          Back to events
        </button>
      </div>
    );
  }

  function handleAnswer(option: string) {
    if (!question || revealed) return;

    setSelectedAnswer(option);
    const isCorrect = option === question.answer;

    if (isCorrect) {
      const challenge = loadSavedChallenges().find((item) => item.id === eventId) ?? null;
      const cardAwarded = challenge ? awardCollectedCardForChallenge(challenge) : false;

      setFeedback(
        cardAwarded && challenge?.card
          ? `Correct! You earned the ${challenge.card.badge} card.`
          : "Correct!"
      );
    } else {
      setFeedback(`Not quite. The correct answer is: ${question.answer}`);
    }
    setRevealed(true);
  }

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_2px_35px_-10px_rgba(4,54,115,0.2)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C9A24B]">
            Event challenge
          </p>
          <h3 className="mt-2 font-serif text-2xl text-[#043673]">{eventTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{eventLocation}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#043673]/10 bg-[#043673]/5 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${difficultyColors[question.difficulty]}`}>
            {question.difficulty}
          </span>
        </div>
        <p className="text-lg font-medium leading-7 text-[#0A1F3D]">{question.prompt}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {question.options.map((option) => {
          const isCorrect = option === question.answer;
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              disabled={revealed}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                revealed && isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : revealed && isSelected && !isCorrect
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-gray-200 bg-white text-[#0A1F3D] hover:border-[#C9A24B] hover:bg-[#C9A24B]/5",
                revealed ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              {option}
              {revealed && isCorrect && <span className="ml-2 text-xs font-semibold">✓</span>}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="mt-5 rounded-xl border border-[#043673]/10 bg-[#043673]/5 px-4 py-3 text-sm text-[#043673]">
          {feedback}
          {revealed && <p className="mt-1 text-xs text-gray-600">{question.explanation}</p>}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eventCatalog[eventId]?.activeWindow ?? "Campus quest"}
        </span>

        <button
          type="button"
          onClick={() => router.push("/dashboard/events")}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-white"
          style={{ background: WITS_BLUE }}
        >
          {revealed ? "Back to events" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
