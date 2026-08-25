"use client";

import dynamic from "next/dynamic";

const CampusMap = dynamic(
  () => import("@/components/CampusMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading map...
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A24B]">
          Explore
        </p>

        <h1 className="mt-2 font-serif text-3xl text-[#043673]">
          Campus Map
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View your current location and nearby Wits Quest events.
        </p>
      </header>

      <div className="h-[calc(100vh-180px)] min-h-[500px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
        <CampusMap />
      </div>
    </div>
  );
}