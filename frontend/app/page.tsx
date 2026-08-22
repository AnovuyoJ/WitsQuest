"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/Login");
      }
    });

    // 2. Listen for Google OAuth hash token detection
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Redirecting to Wits Quest…
      </p>
    </div>
  );
}