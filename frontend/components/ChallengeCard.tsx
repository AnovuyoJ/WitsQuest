"use client";

import { useState } from "react";
import { useChallenge } from "@/lib/useChallenge";

export default function ChallengeCard({ eventId }: { eventId: string }) {
  const { state, submit, nextQuestion } = useChallenge(eventId);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  if (state.status === "loading") return <div className="animate-pulse rounded-2xl border border-[#043673]/10 bg-white p-6" role="status"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-5 h-6 w-full rounded bg-slate-200" /><div className="mt-5 h-12 rounded-xl bg-slate-100" /><div className="mt-3 h-12 rounded-xl bg-slate-100" /><span className="sr-only">Loading challenge</span></div>;
  if (state.status === "error") return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{state.message}</div>;

  if (state.status === "result") {
    const { result } = state;
    const completed = result.alreadyCompleted;
    const correct = result.correct;
    return (
      <section className={`overflow-hidden rounded-2xl border bg-white ${completed ? "border-slate-200" : correct ? "border-emerald-200" : "border-red-200"}`}>
        <div className={`h-2 ${completed ? "bg-slate-400" : correct ? "bg-emerald-500" : "bg-red-500"}`} />
        <div className="p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-500">Challenge result</p><h3 className={`mt-3 text-3xl font-black tracking-[-.04em] ${completed ? "text-slate-700" : correct ? "text-emerald-700" : "text-red-700"}`}>{completed ? "Already completed" : correct ? "Correct." : "Not this time."}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{completed ? "You have already recorded a result for this challenge." : <>The answer was <strong className="text-slate-900">{result.correctAnswer}</strong>.</>}</p>
          {result.cardAwarded && <div className="mt-5 border-l-4 border-[#C9A24B] bg-[#F5EDD8] px-4 py-3 text-sm font-bold text-[#043673]">New card added to your collection</div>}
          <button type="button" onClick={() => { setSelectedOption(null); setTextAnswer(""); nextQuestion(); }} className="mt-6 w-full rounded-xl bg-[#043673] py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[.99]">{completed ? "Try another question" : "Next question"}</button>
        </div>
      </section>
    );
  }

  const challenge = state.challenge;
  const submitting = state.status === "submitting";
  const options = challenge.question_type === "true_false" ? ["True", "False"] : challenge.options;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#043673]/12 bg-white">
      <div className="flex items-center justify-between bg-[#043673] px-5 py-3 text-white"><span className="text-[10px] font-bold uppercase tracking-[.24em] text-[#E2C66F]">Campus challenge</span><span className="text-xs text-white/60">Choose one answer</span></div>
      <div className="p-5 sm:p-7"><h3 className="text-xl font-black leading-tight tracking-[-.025em] text-[#043673] sm:text-2xl">{challenge.question_text}</h3>
        {options && <div className={`mt-6 grid gap-3 ${challenge.question_type === "true_false" ? "grid-cols-2" : ""}`}>{options.map((option, index) => <button key={option} type="button" onClick={() => setSelectedOption(option)} disabled={submitting} aria-pressed={selectedOption === option} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition active:scale-[.99] ${selectedOption === option ? "border-[#043673] bg-[#043673] text-white" : "border-slate-200 text-slate-700 hover:border-[#C9A24B] hover:bg-[#F9F6EE]"}`}><span className={`font-mono text-[10px] ${selectedOption === option ? "text-[#E2C66F]" : "text-slate-400"}`}>{String(index + 1).padStart(2, "0")}</span>{option}</button>)}</div>}
        {challenge.question_type === "text" && <input type="text" value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} disabled={submitting} placeholder="Type your answer" className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#043673] focus:ring-4 focus:ring-[#043673]/10" />}
        <button type="button" onClick={() => submit(challenge.question_type === "text" ? textAnswer : (selectedOption ?? ""))} disabled={submitting || (challenge.question_type === "text" ? textAnswer.trim() === "" : !selectedOption)} className="mt-6 w-full rounded-xl bg-[#C9A24B] py-3.5 text-sm font-black text-[#082C58] transition hover:bg-[#D8B963] active:scale-[.99] disabled:cursor-wait disabled:opacity-50">{submitting ? "Checking answer..." : "Lock in answer"}</button>
      </div>
    </section>
  );
}
