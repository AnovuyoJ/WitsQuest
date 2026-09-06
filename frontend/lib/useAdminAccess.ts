"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

async function getAdminAccess(): Promise<boolean> {
  const response = await fetch("/api/admin/access", { credentials: "include" });
  if (!response.ok) return false;

  const result: unknown = await response.json();
  return typeof result === "boolean"
    ? result
    : typeof result === "object" && result !== null &&
        "isAdmin" in result && result.isAdmin === true;
}

export function useAdminAccess() {
  const [access, setAccess] = useState({ checkingAccess: true, isAdmin: false });
  useEffect(() => {
    let active = true;
    let version = 0;
    async function check() {
      const current = ++version;
      const isAdmin = await getAdminAccess();
      if (active && current === version) setAccess({ checkingAccess: false, isAdmin });
    }
    void check();
    // Defer auth-dependent requests until Supabase's auth callback releases its lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(() => { if (active) void check(); }, 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return access;
}
