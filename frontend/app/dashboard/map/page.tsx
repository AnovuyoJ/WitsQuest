'use client';

import dynamic from 'next/dynamic';

// Dynamically import CampusMap with SSR disabled
const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[80vh] w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      Loading Wits Campus Map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="h-full w-full p-4">
      <CampusMap />
    </div>
  );
}