export type QuestSummary = {
  event_id: string;
  total_questions: number;
  completed_questions: number;
  rewards: { id: string; title: string; rarity: "Blue" | "Black" | "Gold"; points: number }[];
};

export default function QuestProgress({ summary }: { summary: QuestSummary }) {
  const complete = summary.total_questions > 0 && summary.completed_questions >= summary.total_questions;
  return (
    <section className="mt-4 space-y-4" aria-label="Quest progress and rewards">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <span className="text-[#043673] skeuo-text-emboss">
            {complete ? "Quest completed!" : "Your progress"}
          </span>
          <span className="text-slate-600">
            {summary.completed_questions} of {summary.total_questions} questions completed
          </span>
        </div>
        {summary.total_questions > 0 ? (
          <progress
            aria-label="Questions completed"
            value={summary.completed_questions}
            max={summary.total_questions}
            className="skeuo-progress block h-3 w-full"
          />
        ) : (
          <p className="text-xs text-slate-500 font-medium">Questions are coming soon.</p>
        )}
      </div>

      <details className="skeuo-well p-4 border-[#C9A24B]/30">
        <summary className="cursor-pointer rounded text-xs font-black text-[#775718] skeuo-text-emboss focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#775718]">
          Cards to discover <span className="ml-1 font-semibold text-slate-600">({summary.rewards.length})</span>
        </summary>
        {summary.rewards.length ? (
          <>
            <ul className="mt-3 space-y-2.5">
              {summary.rewards.map((reward) => (
                <li
                  key={reward.id}
                  className="skeuo-card flex items-center gap-3.5 p-3.5 border-[#043673]/12"
                >
                  <span
                    aria-hidden="true"
                    className={`h-12 w-9 shrink-0 rotate-[-6deg] rounded-md border-2 shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
                      reward.rarity === "Gold"
                        ? "border-[#C9A24B] bg-gradient-to-br from-[#FFE8A3] via-[#AE802D] to-[#F0D286]"
                        : reward.rarity === "Black"
                        ? "border-slate-500 bg-gradient-to-br from-[#8B98AA] via-[#29313E] to-[#111D2B]"
                        : "border-[#799ABD] bg-gradient-to-br from-[#DFEAF5] via-[#2976B4] to-[#173E65]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-black text-[#043673] skeuo-text-emboss">
                      {reward.title}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {reward.rarity} rarity · {reward.points} card points
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-4 text-slate-500 font-medium">
              Correct answers can earn these cards. Completing every question does not guarantee every reward.
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No card rewards announced yet.</p>
        )}
      </details>
    </section>
  );
}
