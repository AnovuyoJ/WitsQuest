"use client";

import dynamic from "next/dynamic";
import { ScreenHeader } from "@/components/WitsScreen";

const CampusMap = dynamic(
  () => import("@/components/CampusMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#E8EDF4] text-sm font-semibold text-[#043673]"><span className="mr-3 h-3 w-3 animate-pulse rounded-full bg-[#C9A24B]" />Preparing campus map</div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="min-h-full px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <ScreenHeader eyebrow="Explore Wits" title="Campus map" description="Follow live challenge zones and check when you are close enough to play." />
      <div className="h-[calc(100dvh-210px)] min-h-[430px] overflow-hidden rounded-2xl border border-[#043673]/15 bg-white shadow-[0_18px_50px_-38px_rgba(4,54,115,.8)]">
        <CampusMap />
      </div>
    </div>
  );
}
