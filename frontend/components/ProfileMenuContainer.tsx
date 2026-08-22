"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileMenu from "../app/dashboard/ProfileMenu";

export default function ProfileMenuContainer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setName(user.user_metadata?.full_name || "Wits Quest User");
        setEmail(user.email ?? "");
      }
      setLoading(false);
    }

    loadUser();

    // Keep the menu in sync if the user signs out / signs in elsewhere
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setName(session.user.user_metadata?.full_name || "Wits Quest User");
        setEmail(session.user.email ?? "");
      } else {
        setName("");
        setEmail("");
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />;
  }

  return <ProfileMenu name={name} email={email} />;
}