"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);

  async function removeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmation !== "DELETE") return;
    setBusy(true); setError("");
    const result = await apiRequest<{ success: boolean }>("/me", "DELETE", { confirmation });
    if (result.error) { setError(result.error.message); setBusy(false); return; }
    setDeleted(true);
    // Local sign-out clears the browser session even though the account is gone.
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      window.location.replace("/Login");
    }
  }

  return <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-12 text-[#10233d]">
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-[#043673]">Delete account</h1>
      {deleted ? <p role="status" className="mt-5">Your account has been deleted. Returning to sign in…</p> : <>
        <p className="mt-4 leading-7 text-slate-600">This permanently removes your account, collected cards, quest progress, notifications, and matches involving you. Other players keep their cards. This cannot be undone.</p>
        <form onSubmit={removeAccount} className="mt-6 space-y-4">
          <label htmlFor="delete-confirmation" className="block text-sm font-semibold">Type DELETE to confirm</label>
          <input id="delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} className="w-full rounded-lg border border-slate-300 p-3" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center gap-5">
            <button type="submit" disabled={busy || confirmation !== "DELETE"} className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Permanently delete account"}</button>
            {!busy && <Link href="/dashboard" className="font-semibold text-[#043673] underline">Cancel</Link>}
          </div>
        </form>
      </>}
    </section>
  </main>;
}
