"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, type CardRecord } from "@/lib/api";
import styles from "./RewardReveal.module.css";

export default function RewardReveal({ cardId }: { cardId: string | null }) {
  const [card, setCard] = useState<CardRecord | null>(null);
  useEffect(() => {
    let active = true;
    if (cardId) void apiRequest<CardRecord[]>(`/cards?ids=${encodeURIComponent(cardId)}`).then(result => {
      if (active) setCard(result.data?.find(item => item.id === cardId) ?? null);
    });
    return () => { active = false; };
  }, [cardId]);
  const palette = card?.rarity === "Black" ? "border-slate-600 bg-slate-800 text-white" : card?.rarity === "Blue" ? "border-[#799ABD] bg-[#EDF3FA] text-[#043673]" : "border-[#C9A24B] bg-[#FFF8E5] text-[#604713]";
  return <section className="mt-5 rounded-2xl border border-[#E8D9B6] bg-[#FAF8F3] p-5 text-center" aria-label="Reward earned">
    <p role="status" className="text-sm font-bold text-[#775718]">New card earned!</p>
    {card ? <div className={`${styles.reveal} mx-auto mt-4 max-w-60 rounded-xl border-2 p-5 shadow-lg ${palette}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest">{card.rarity} rarity</p>
      <span aria-hidden="true" className="my-3 block text-3xl">✦</span>
      <h4 className="break-words text-xl font-black">{card.title}</h4>
      <p className="mt-3 text-sm font-semibold">{card.points} card points</p>
    </div> : <p className="mt-3 text-sm text-slate-600">Your reward has been added to your collection.</p>}
    <Link href="/dashboard/cards" className="mt-4 inline-block text-xs font-semibold text-[#775718] underline">Claim your discovery ? view collection</Link>
  </section>;
}
