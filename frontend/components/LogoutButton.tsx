"use client";

import { signOut } from "@/lib/authService";
import { clearOfflineDataForOwner } from "@/lib/offlineDb";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  collapsed: boolean;
};

export default function LogoutButton({ collapsed }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await signOut();

      if (error) {
        console.error("Logout error:", error);
        return;
      }

      if (sessionData.session?.user.id) await clearOfflineDataForOwner(sessionData.session.user.id);

      router.push("/Login");
      router.refresh();
    } catch (err) {
      console.error("Unexpected logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label={collapsed ? (loading ? "Logging out..." : "Logout") : undefined}
      className={`flex items-center rounded-xl py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
        collapsed
          ? "w-10 justify-center px-0 hover:bg-white/10"
          : "w-full gap-3 px-3"
      }`}
      style={{
        background: collapsed
          ? "transparent"
          : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
        color: "rgba(255,255,255,0.65)",
        boxShadow: collapsed
          ? "none"
          : "0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)",
        border: collapsed ? "none" : "1px solid rgba(255,255,255,0.10)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
      }}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <LogoutIcon />
      </span>

      {!collapsed && (
        <span>
          {loading ? "Logging out..." : "Logout"}
        </span>
      )}
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
