"use client";

import { useOfflineSync } from "@/lib/useOfflineSync";

export default function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useOfflineSync();
  return <>{children}</>;
}