import type { ReactNode } from "react";

export default function AdminPageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <header className="skeuo-plate-navy rounded-2xl p-6 sm:p-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E2C66F]">Admin console</p>
        <h1 className="mt-2 break-words text-4xl font-black tracking-[-0.045em] text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{description}</p>}
      </div>
      {action}
    </div>
  </header>;
}
