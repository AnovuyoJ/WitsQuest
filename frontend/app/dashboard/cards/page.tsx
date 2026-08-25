"use client";

import { useEffect, useState } from "react";
import {
  COLLECTED_CARDS_UPDATED_EVENT,
  loadCollectedCards,
  type CollectedCard,
} from "@/lib/adminChallenges";

export default function CardsPage() {
  const [cards, setCards] = useState<CollectedCard[]>([]);

  useEffect(() => {
    const syncCards = () => setCards(loadCollectedCards());

    syncCards();
    window.addEventListener(COLLECTED_CARDS_UPDATED_EVENT, syncCards);

    return () => {
      window.removeEventListener(COLLECTED_CARDS_UPDATED_EVENT, syncCards);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A24B]">Collection</p>
        <h1 className="font-serif text-3xl text-[#043673]">My cards</h1>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center shadow-[0_2px_20px_-10px_rgba(4,54,115,0.12)]">
          <p className="text-sm text-slate-500">No cards collected yet. Answer a challenge correctly to add one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-[24px] border border-slate-200 p-5 text-white shadow-xl"
              style={{ background: `linear-gradient(135deg, ${card.accent}, rgba(0,0,0,0.85))` }}
            >
              <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                {card.badge}
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/70">Wits Quest</p>
                  <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/90">
                    {card.tag || "General"}
                  </span>
                </div>

                <h2 className="mt-3 font-serif text-2xl leading-tight">{card.title}</h2>
                <p className="mt-2 text-sm text-white/80">{card.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <span>{card.strength}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
