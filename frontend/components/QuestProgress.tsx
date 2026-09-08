export type QuestSummary = {
  event_id: string; total_questions: number; completed_questions: number;
  rewards: { id: string; title: string; rarity: "Blue" | "Black" | "Gold"; points: number }[];
};

export default function QuestProgress({ summary }: { summary: QuestSummary }) {
  const complete = summary.total_questions > 0 && summary.completed_questions >= summary.total_questions;
  return <section className="mt-4 space-y-4" aria-label="Quest progress and rewards">
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">{complete ? "Quest completed" : "Your progress"}</span>
        <span className="text-slate-600">{summary.completed_questions} of {summary.total_questions} questions completed</span>
      </div>
      {summary.total_questions > 0 ? <progress aria-label="Questions completed" value={summary.completed_questions} max={summary.total_questions} className="block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-stone-100 [&::-webkit-progress-value]:bg-[#C9A24B] [&::-moz-progress-bar]:bg-[#C9A24B]" /> : <p className="text-xs text-slate-500">Questions are coming soon.</p>}
    </div>
    <details className="rounded-xl border border-[#E8D9B6] bg-[#FFFCF5] p-3">
      <summary className="cursor-pointer rounded text-xs font-semibold text-[#775718] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#775718]">Cards to discover <span className="ml-1 font-normal">({summary.rewards.length})</span></summary>
      {summary.rewards.length ? <>
        <ul className="mt-2 space-y-2">{summary.rewards.map(reward => <li key={reward.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-[#FFFCF5] p-3">
          <span aria-hidden="true" className={`h-12 w-9 shrink-0 rotate-[-8deg] rounded-md border-2 shadow-sm ${reward.rarity === "Gold" ? "border-[#C9A24B] bg-[#F4E5BB]" : reward.rarity === "Black" ? "border-slate-500 bg-slate-700" : "border-[#799ABD] bg-[#DFEAF5]"}`} />
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-800">{reward.title}</p><p className="mt-0.5 text-xs text-slate-600">{reward.rarity} rarity · {reward.points} card points</p></div>
        </li>)}</ul>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">Correct answers can earn these cards. Completing every question does not guarantee every reward.</p>
      </> : <p className="mt-2 text-xs text-slate-500">No card rewards announced yet.</p>}
    </details>
  </section>;
}
