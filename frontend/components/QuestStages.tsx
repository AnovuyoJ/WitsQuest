import Link from "next/link";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";

export default function QuestStages({ active, nearby, verified, total, completed, hasRewards }: {
  active: boolean; nearby: boolean; verified: boolean; total: number; completed: number; hasRewards: boolean;
}) {
  const finished = total > 0 && completed >= total;
  const current = finished ? 3 : verified ? 2 : nearby ? 1 : 0;
  const labels = ["Travel", "Verify arrival", "Complete challenge", hasRewards ? "Earn card" : "Finish quest"];
  return (
    <section aria-label="Quest stages" className="skeuo-well mt-4 p-4 border-[#C9A24B]/25">
      <ol className="flex flex-wrap items-center gap-y-2 text-xs">
        {labels.map((label, index) => (
          <li
            key={label}
            aria-current={index === current && (active || finished) ? "step" : undefined}
            className="flex items-center"
          >
            {index > 0 && (
              <ForwardArrowIcon className="mx-2 text-slate-400" />
            )}
            <span
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                index < current
                  ? "skeuo-badge-emerald"
                  : index === current && (active || finished)
                  ? "skeuo-badge-gold"
                  : "text-slate-500 bg-white/60 border border-slate-200/80 shadow-[inset_0_1px_1px_#fff]"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs leading-5 text-slate-600 font-medium">
        {finished
          ? hasRewards
            ? "Questions completed! Eligible correct answers earn cards automatically."
            : "You have completed this quest."
          : !active
          ? "This quest is not currently active."
          : verified
          ? "Arrival verified. Complete the questions to progress."
          : nearby
          ? "You appear nearby. Verify your arrival to unlock the challenge."
          : "Travel to the location, then verify your arrival."}
      </p>
      {finished && hasRewards && (
        <Link
          href="/dashboard/cards"
          className="mt-2.5 inline-block text-xs font-black text-[#775718] underline underline-offset-4 hover:text-[#043673]"
        >
          <span className="inline-flex items-center gap-1">View my collection <ForwardArrowIcon /></span>
        </Link>
      )}
    </section>
  );
}
