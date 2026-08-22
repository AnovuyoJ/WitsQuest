"use client";

import { signOut } from "@/lib/authService";
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
      const { error } = await signOut();

      if (error) {
        console.error("Logout error:", error);
        return;
      }

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
      className={`flex items-center rounded-xl py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/90 ${
        collapsed
          ? "w-10 justify-center px-0"
          : "w-full gap-3 px-3"
      }`}
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