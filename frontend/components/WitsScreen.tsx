import type { ReactNode } from "react";

export function ScreenHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 md:mb-8">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#9A741E]">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.6rem)] font-bold leading-none tracking-[-0.045em] text-[#043673]">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function StatePanel({ title, description, children, tone = "blue" }: { title: string; description: string; children?: ReactNode; tone?: "blue" | "red" }) {
  const red = tone === "red";
  return (
    <section className={`rounded-2xl border p-6 sm:p-8 ${red ? "border-red-200 bg-red-50" : "border-[#043673]/12 bg-white"}`}>
      <div className={`mb-5 h-1 w-12 rounded-full ${red ? "bg-red-500" : "bg-[#C9A24B]"}`} />
      <h2 className={`text-xl font-bold tracking-tight ${red ? "text-red-800" : "text-[#043673]"}`}>{title}</h2>
      <p className={`mt-2 max-w-lg text-sm leading-6 ${red ? "text-red-700" : "text-slate-600"}`}>{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

export function ScreenSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading content" role="status">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="h-48 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="mt-6 h-6 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
