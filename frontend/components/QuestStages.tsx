import Link from "next/link";

export default function QuestStages({ active, nearby, verified, total, completed, hasRewards }: {
  active: boolean; nearby: boolean; verified: boolean; total: number; completed: number; hasRewards: boolean;
}) {
  const finished = total > 0 && completed >= total;
  const current = finished ? 3 : verified ? 2 : nearby ? 1 : 0;
  const labels = ["Travel", "Verify arrival", "Complete challenge", hasRewards ? "Earn card" : "Finish quest"];
  return <section aria-label="Quest stages" className="mt-4 rounded-xl border border-stone-200 bg-[#FAF8F3] p-3">
    <ol className="flex flex-wrap items-center gap-y-2 text-xs">
      {labels.map((label, index) => <li key={label} aria-current={index === current && (active || finished) ? "step" : undefined} className="flex items-center">
        {index > 0 && <span aria-hidden="true" className="mx-2 text-stone-400">→</span>}
        <span className={`rounded-md px-2 py-1 ${index < current ? "text-emerald-800" : index === current && (active || finished) ? "bg-[#EBD9AD] font-semibold text-[#604713]" : "text-slate-600"}`}>{label}</span>
      </li>)}
    </ol>
    <p className="mt-2 text-xs leading-5 text-slate-600">{finished ? hasRewards ? "Questions completed. Eligible correct answers earn cards automatically." : "You have completed this quest." : !active ? "This quest is not currently active." : verified ? "Arrival verified. Complete the questions to progress." : nearby ? "You appear nearby. Verify your arrival to unlock the challenge." : "Travel to the location, then verify your arrival."}</p>
    {finished && hasRewards && <Link href="/dashboard/cards" className="mt-2 inline-block text-xs font-semibold text-[#775718] underline">View my collection</Link>}
  </section>;
}
