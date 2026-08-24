"use client";

import CampusMap from "@/components/CampusMap";

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-32px)] w-full overflow-hidden bg-transparent">
      <CampusMap />
    </div>
  );
}
