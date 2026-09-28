"use client";

import { useEffect, useState } from "react";
import { syncOfflineAttempts, type SyncResult } from "./offlineSync";

export function useOfflineSync() {
  const [results, setResults] = useState<SyncResult[]>([]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      void syncOfflineAttempts().then((next) => {
        if (active && next.length) setResults(next);
      });
    };
    if (navigator.onLine) sync();
    window.addEventListener("online", sync);
    return () => { active = false; window.removeEventListener("online", sync); };
  }, []);

  return { results, clearResults: () => setResults([]) };
}
