"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

type Draft = Record<string, unknown> & { id: string; draft_revision: number; published_revision: number | null };
const labels: Record<string, string> = {
  title: "Event title", description: "Description", latitude: "Latitude", longitude: "Longitude",
  radius_meters: "Radius (metres)", starts_at: "Starts at", ends_at: "Ends at",
  event_id: "Event ID", question_text: "Question", question_type: "Question type",
  options: "Answer options", correct_answer: "Correct answer", card_id: "Reward card ID",
};

export default function ContentReview({ kind, id, onPublished }: {
  kind: "events" | "challenges"; id: string; onPublished: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function open() {
    setBusy(true); setError(""); setMessage(""); setReviewed(false); setDraft(null);
    const result = await apiRequest<Draft>(`/admin/${kind}/${id}/review`);
    setBusy(false);
    if (result.error) setError(result.error.message);
    else setDraft(result.data);
  }
  async function act(action: "review" | "publish") {
    if (!draft) return;
    setBusy(true); setError("");
    const result = await apiRequest<Draft>(`/admin/${kind}/${id}/${action}`, "POST", { revision: draft.draft_revision });
    setBusy(false);
    if (result.error) { setError(result.error.message); setReviewed(false); return; }
    if (action === "review") setReviewed(true);
    else { setDraft(null); setMessage("Published successfully."); onPublished(); }
  }
  return <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
    <button type="button" disabled={busy} onClick={open} className="font-semibold text-[#043673] underline disabled:opacity-50">{busy ? "Please wait…" : "Review saved draft"}</button>
    {error && <p role="alert" className="mt-2 text-red-700">{error} <button type="button" disabled={busy} onClick={open} className="underline">Reload review</button></p>}
    {message && <p role="status" className="mt-2 text-green-700">{message}</p>}
    {draft && <section aria-label="Content review" className="mt-3">
      <h4 className="font-bold">Review before publishing</h4>
      <p className="mt-1 text-slate-600">This is the saved draft. Unsaved form changes are not included. {draft.published_revision === null ? "Players cannot see it yet." : "The previous published version remains live until you publish."}</p>
      <dl className="my-3 space-y-2">{Object.entries(labels).filter(([key]) => key in draft).map(([key, label]) => <div key={key}>
        <dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words">{Array.isArray(draft[key]) ? (draft[key] as string[]).join("\n") : String(draft[key] ?? "None")}</dd>
      </div>)}</dl>
      <div className="flex flex-wrap gap-3">
        {!reviewed ? <button type="button" disabled={busy} onClick={() => act("review")} className="rounded-lg bg-[#043673] px-3 py-2 text-white disabled:opacity-50">I have reviewed this draft</button> : <button type="button" disabled={busy} onClick={() => act("publish")} className="rounded-lg bg-[#043673] px-3 py-2 text-white disabled:opacity-50">Publish reviewed content</button>}
        <button type="button" disabled={busy} onClick={() => setDraft(null)} className="underline">Close review</button>
      </div>
    </section>}
  </div>;
}
