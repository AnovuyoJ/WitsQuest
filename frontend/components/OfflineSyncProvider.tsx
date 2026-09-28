"use client";

import { useOfflineSync } from "@/lib/useOfflineSync";

export default function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { results, clearResults } = useOfflineSync();
  const accepted = results.filter((result) => result.status === "accepted").length;
  const rejected = results.filter((result) => result.status === "rejected").length;
  const retrying = results.filter((result) => result.status === "retry").length;
  return <>
    {children}
    {results.length > 0 && <div role="status" className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-[#C9A24B] bg-white p-4 text-sm text-[#10233D] shadow-xl">
      <strong className="text-[#043673]">Offline answers synchronized</strong>
      <p className="mt-1">{accepted} accepted{rejected ? `, ${rejected} rejected` : ""}{retrying ? `, ${retrying} waiting to retry` : ""}.</p>
      {rejected > 0 && <p className="mt-1 text-xs text-red-700">{results.find((result) => result.status === "rejected")?.message}</p>}
      <button type="button" onClick={clearResults} className="mt-2 font-bold text-[#043673] underline">Dismiss</button>
    </div>}
  </>;
}
