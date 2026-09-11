"use client";

import { useEffect, useState } from "react";
import { apiRequest, type CardRecord } from "@/lib/api";

type Options = { owned: number; extras: number; event_title: string; targets: CardRecord[] };
export default function DuplicateExchange({ source, onClose, onComplete }: {
  source: { id: string; title: string; rarity: string }; onClose: () => void; onComplete: () => void;
}) {
  const [options,setOptions] = useState<Options | null>(null);
  const [targetId,setTargetId] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Options>(`/me/cards/${source.id}/exchanges`).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setOptions(result.data);
    });
    return () => { active = false; };
  },[source.id,retry]);
  const target = options?.targets.find(card => card.id === targetId);
  async function exchange() {
    if (!target || busy) return;
    setBusy(true); setError("");
    const result = await apiRequest<{ card: CardRecord }>("/me/cards/exchange","POST",{ sourceCardId: source.id,targetCardId: targetId });
    if (result.error) { setError(result.error.message); setTargetId(""); setRetry(value => value+1); }
    else { setSuccess(`You received ${result.data?.card.title}. Your original ${source.title} is safe.`); onComplete(); }
    setBusy(false);
  }
  return <section aria-label="Exchange duplicate cards" className="mb-6 rounded-2xl border-2 border-[#C9A24B] bg-white p-6 text-slate-800">
    <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-bold text-[#043673]">Exchange extras: {source.title}</h2><button autoFocus disabled={busy} onClick={onClose} className="text-sm underline">Close</button></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    {success ? <p role="status" className="mt-4 text-sm text-emerald-800">{success}</p> : !options ? <p className="mt-4" role="status">{error ? "Could not load rewards." : "Loading available rewards…"}</p> : <>
      <p className="mt-3 text-sm leading-6">{options.event_title} · {source.rarity} · Owned: {options.owned} · Extras: {options.extras}</p>
      {options.extras < 3 ? <p className="mt-3 text-sm">You need 3 extra copies plus your original. Keep collecting this card.</p> : !options.targets.length ? <p className="mt-3 text-sm">No unowned published {source.rarity} rewards remain in this event. Keep your extras for future rewards; nothing will be spent.</p> : <>
        <label className="mt-4 block text-sm font-semibold">Choose an unowned {source.rarity} reward from this event
          <select value={targetId} disabled={busy} onChange={event => setTargetId(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3">
            <option value="">Select a reward</option>{options.targets.map(card => <option key={card.id} value={card.id}>{card.title} — {card.points} points</option>)}
          </select>
        </label>
        {target && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6"><strong>Confirm your exchange</strong><p>Spend 3 extra copies of {source.title} to receive 1 {target.title} ({target.rarity}, {target.points} points). You keep {options.owned-3} {source.title} {options.owned-3 === 1 ? "copy" : "copies"}. This exchange cannot be undone.</p></div>}
        <button disabled={!target || busy} onClick={exchange} className="mt-4 rounded-xl bg-[#043673] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Exchanging…" : "Confirm exchange"}</button>
      </>}
    </>}
  </section>;
}
