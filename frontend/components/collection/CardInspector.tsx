"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerCardRecord } from "@/lib/api";
import DuplicateExchange from "@/components/DuplicateExchange";
import CollectibleCard from "./CollectibleCard";
import styles from "./album.module.css";

export default function CardInspector({ copy, owned, questTitle, onClose, onExchange, returnFocus }: {
  copy: PlayerCardRecord; owned: number; questTitle: string; onClose: () => void; onExchange: () => void; returnFocus: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [exchanging, setExchanging] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const opener = returnFocus;
    const overflow = document.body.style.overflow;
    if (element && !element.open) element.showModal();
    document.body.style.overflow = "hidden";
    // Removing the dialog closes it natively. Calling close here would emit an
    // onClose event during Strict Mode's setup/cleanup check and dismiss it on opening.
    return () => { document.body.style.overflow = overflow; opener?.focus(); };
  }, [returnFocus]);
  const card = copy.cards;
  if (!card) return null;
  const earned = copy.awarded_at ? new Date(copy.awarded_at) : null;
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="card-inspector-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4"><p className="text-xs font-bold uppercase tracking-widest">Your discovery</p><button autoFocus type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-current px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">Close</button></div>
      <div className="grid items-start gap-7 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className={`${styles.reveal} mx-auto w-full max-w-80`}><CollectibleCard card={card} questTitle={questTitle} /></div>
        <div>
          <p className="text-sm font-semibold">{questTitle}</p>
          <h2 id="card-inspector-title" className="mt-2 text-3xl font-black tracking-tight">{card.title}</h2>
          <p className="mt-4 text-sm leading-7">{card.description || "A discovery from your campus adventures. Keep it in your collection or choose it for your next battle."}</p>
          <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-current/20 py-5 text-sm">
            <div><dt className="text-xs opacity-75">Rarity</dt><dd className="mt-1 font-bold">{card.rarity}</dd></div>
            <div><dt className="text-xs opacity-75">Battle points</dt><dd className="mt-1 font-bold">{card.points} / 100</dd></div>
            <div><dt className="text-xs opacity-75">Copies owned</dt><dd className="mt-1 font-bold">{owned}</dd></div>
            <div><dt className="text-xs opacity-75">Extra copies</dt><dd className="mt-1 font-bold">{Math.max(0, owned - 1)}</dd></div>
            {earned && !Number.isNaN(earned.getTime()) && <div className="col-span-2"><dt className="text-xs opacity-75">Earned</dt><dd className="mt-1 font-semibold">{earned.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</dd></div>}
          </dl>
          {!exchanging && <button type="button" onClick={() => setExchanging(true)} className="mt-6 rounded-xl bg-[#043673] px-5 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2989c4]">{owned >= 4 ? "Exchange 3 extras" : "Exchange details"}</button>}
          <p className="mt-4 text-xs leading-5 opacity-75">A collectible emblem from your campus adventures. Your card’s points and rarity determine its battle value.</p>
        </div>
      </div>
      {exchanging && <div className="mt-7"><DuplicateExchange source={card} onClose={() => setExchanging(false)} onComplete={onExchange} /></div>}
    </div>
  </dialog>;
}
