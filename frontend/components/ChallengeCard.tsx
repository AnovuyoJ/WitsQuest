"use client";

import { useEffect, useState } from "react";
import { useChallenge } from "@/lib/useChallenge";
import RewardReveal from "./RewardReveal";

export default function ChallengeCard({ eventId, onAnswered }: { eventId: string; onAnswered?: () => void }) {
  const { state, submit, nextQuestion } = useChallenge(eventId);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  useEffect(() => { if (state.status === "result") onAnswered?.(); }, [state, onAnswered]);

  if (state.status === "loading") {
    return (
      <div className="skeuo-card animate-pulse p-6" role="status">
        <div className="h-3 w-24 rounded-full bg-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
        <div className="mt-5 h-6 w-full rounded-lg bg-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
        <div className="mt-5 h-12 rounded-xl bg-slate-100 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]" />
        <div className="mt-3 h-12 rounded-xl bg-slate-100 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]" />
        <span className="sr-only">Loading challenge</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="skeuo-card border-red-200 bg-gradient-to-b from-red-50 to-red-100/60 p-5 text-sm font-bold text-red-700">
        {state.message}
      </div>
    );
  }

  if (state.status === "result") {
    const { result } = state;
    const completed = result.alreadyCompleted;
    const correct = result.correct;
    return (
      <section
        className={`skeuo-card overflow-hidden ${
          completed
            ? "border-slate-300"
            : correct
            ? "border-emerald-300"
            : "border-red-300"
        }`}
      >
        <div
          className={`h-2.5 w-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_3px_rgba(0,0,0,0.2)] ${
            completed
              ? "bg-slate-400"
              : correct
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-gradient-to-r from-red-400 to-red-600"
          }`}
        />
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[.25em] text-slate-500 skeuo-text-emboss">
            Challenge result
          </p>
          <h3
            className={`mt-3 text-3xl font-black tracking-[-.04em] skeuo-text-emboss ${
              completed
                ? "text-slate-700"
                : correct
                ? "text-emerald-800"
                : "text-red-800"
            }`}
          >
            {completed ? "Already completed" : correct ? "Correct!" : "Not this time."}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600 font-medium">
            {completed ? (
              "You have already recorded a result for this challenge."
            ) : (
              <>
                The answer was <strong className="text-slate-900">{result.correctAnswer}</strong>.
              </>
            )}
          </p>
          {result.cardAwarded && correct && !completed && (
            <RewardReveal key={state.challenge.id} cardId={state.challenge.card_id} />
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedOption(null);
              setTextAnswer("");
              nextQuestion();
            }}
            className="skeuo-btn-primary mt-6 w-full py-4 text-sm font-black"
          >
            {completed ? "Explore the next question" : "Continue your quest"}
          </button>
        </div>
      </section>
    );
  }

  if (state.status === "queued") {
    return (
      <section className="skeuo-card overflow-hidden border-amber-300">
        <div className="h-2.5 w-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_3px_rgba(0,0,0,0.2)]" />
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[.25em] text-amber-800 skeuo-text-emboss">
            Answer saved
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-[-.04em] text-amber-800 skeuo-text-emboss">
            Saved offline
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600 font-medium">
            You&apos;re offline right now, so we&apos;ve saved your answer. It&apos;ll be checked automatically once you&apos;re back online.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedOption(null);
              setTextAnswer("");
              onAnswered?.();
            }}
            className="skeuo-btn-primary mt-6 w-full py-4 text-sm font-black"
          >
            Continue your quest
          </button>
        </div>
      </section>
    );
  }

  const challenge = state.challenge;
  const submitting = state.status === "submitting";
  const options = challenge.question_type === "true_false" ? ["True", "False"] : challenge.options;

  return (
    <section className="skeuo-card overflow-hidden border-[#043673]/20">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0a4d9b] to-[#043673] px-5 py-3 text-white border-b border-[#021e42] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
        <span className="text-[11px] font-black uppercase tracking-[.24em] text-[#E2C66F] skeuo-text-deboss">
          Campus challenge
        </span>
        <span className="text-xs font-semibold text-white/75">
          Choose one answer
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-xl font-black leading-tight tracking-[-.025em] text-[#043673] skeuo-text-emboss sm:text-2xl">
          {challenge.question_text}
        </h3>

        {options && (
          <div className={`mt-6 grid gap-3.5 ${challenge.question_type === "true_false" ? "grid-cols-2" : ""}`}>
            {options.map((option, index) => {
              const isSelected = selectedOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  disabled={submitting}
                  aria-pressed={isSelected}
                  className={`flex min-h-12 items-center gap-3.5 rounded-xl px-4 py-3.5 text-left text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-gradient-to-b from-[#094794] to-[#043673] text-white border border-[#021e42] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(201,162,75,0.4),0_1px_0_#fff] translate-y-[2px]"
                      : "bg-gradient-to-b from-white to-[#f2f6fa] text-slate-800 border border-[#cad5e2] shadow-[inset_0_1px_0_#ffffff,0_2px_0_#b0bfd2,0_3px_6px_rgba(0,0,0,0.05)] hover:border-[#c9a24b] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-black ${
                      isSelected ? "text-[#E2C66F] skeuo-text-deboss" : "text-slate-400"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={isSelected ? "skeuo-text-deboss" : "skeuo-text-emboss"}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {challenge.question_type === "text" && (
          <input
            type="text"
            value={textAnswer}
            onChange={(event) => setTextAnswer(event.target.value)}
            disabled={submitting}
            placeholder="Type your answer"
            className="skeuo-input mt-6 w-full px-4 py-3 text-sm"
          />
        )}

        <button
          type="button"
          onClick={() => submit(challenge.question_type === "text" ? textAnswer : (selectedOption ?? ""))}
          disabled={submitting || (challenge.question_type === "text" ? textAnswer.trim() === "" : !selectedOption)}
          className="skeuo-btn-gold mt-7 w-full py-4 text-sm font-black disabled:cursor-wait disabled:opacity-50"
        >
          {submitting ? "Checking answer..." : "Lock in answer"}
        </button>
      </div>
    </section>
  );
}
