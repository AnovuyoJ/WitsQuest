"use client";

import { useEffect } from "react";
import { syncOfflineAttempts } from "./offlineSync";

/**
 * Mount this once near the root of the app (e.g. in layout.tsx or a
 * top-level provider). It triggers a sync of queued offline attempts:
 * - once on load, in case there are attempts left over from a previous
 *   offline session that never got a chance to sync
 * - every time the browser regains connectivity
 */
export function useOfflineSync() {
  useEffect(() => {
    // Attempt a sync on mount, in case we're already online with
    // leftover queued attempts from earlier.
    if (navigator.onLine) {
      syncOfflineAttempts().then((results) => {
        if (results.length > 0) {
          console.log("Offline attempt sync (on load):", results);
        }
      });
    }

    function handleOnline() {
      syncOfflineAttempts().then((results) => {
        if (results.length > 0) {
          console.log("Offline attempt sync (reconnect):", results);
        }
      });
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
