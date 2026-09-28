import type { ReactNode } from "react";

export function ScreenHeader({
  eyebrow,
  title,
  description,
  action,
  eyebrowClassName = "text-white",
  titleClassName = "text-[#775718]",
  descriptionClassName = "text-slate-600",
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 md:mb-8">
      <div className="max-w-2xl">
        <p className={`inline-block text-[11px] font-extrabold uppercase tracking-[0.24em] skeuo-text-emboss ${eyebrowClassName}`}>
          {eyebrow}
        </p>
        <h1 className={`mt-2 text-[clamp(1.8rem,5vw,2.6rem)] font-black leading-none tracking-[-0.045em] skeuo-text-emboss ${titleClassName}`}>
          {title}
        </h1>
        <p className={`mt-3 max-w-xl text-sm leading-6 font-medium ${descriptionClassName}`}>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function StatePanel({ title, description, children, tone = "blue" }: { title: string; description: string; children?: ReactNode; tone?: "blue" | "red" }) {
  const red = tone === "red";
  return (
    <section
      className={`relative overflow-hidden p-6 sm:p-8 ${
        red
          ? "skeuo-card border-red-200/80 bg-gradient-to-b from-red-50/60 to-red-100/40"
          : "border border-[#d4ad69]/50 rounded-[1.5rem]"
      }`}
      style={
        !red
          ? {
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.08)), linear-gradient(135deg, #8c4b2a 0%, #602d16 42%, #3b1706 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(214, 173, 96, 0.2), 0 18px 40px -10px rgba(35, 23, 16, 0.4)",
            }
          : undefined
      }
    >
      {!red && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 2px, rgba(38,22,11,0.12) 2px, rgba(38,22,11,0.12) 6px)",
            mixBlendMode: "soft-light",
          }}
        />
      )}
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`h-2.5 w-12 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.15)] ${
              red
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-[#e5c36e] via-[#c9a24b] to-[#a37c28]"
            }`}
          />
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              red ? "text-red-700" : "text-[#F4D58A]"
            }`}
          >
            Notice
          </span>
        </div>
        <h2
          className={`text-2xl font-black tracking-tight skeuo-text-emboss ${
            red ? "text-red-900" : "text-white"
          }`}
        >
          {title}
        </h2>
        <p className={`mt-2 max-w-lg text-sm leading-6 ${red ? "text-red-700" : "text-white/85"}`}>
          {description}
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function ScreenSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading content" role="status">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="skeuo-card h-48 p-5">
          <div className="h-3 w-20 rounded-full bg-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
          <div className="mt-6 h-6 w-3/4 rounded-lg bg-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
          <div className="mt-4 h-3 w-full rounded-md bg-slate-100 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]" />
          <div className="mt-2.5 h-3 w-2/3 rounded-md bg-slate-100 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]" />
        </div>
      ))}
    </div>
  );
}
