"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";

const WITS_BLUE = "#043673";

type Card = {
  id: string;
  title: string;
  rarity: "Blue" | "Black" | "Gold";
  description: string | null;
  accent: string | null;
  badge: string | null;
  strength: string | null;
  points: number;
  tag: string | null;
};

type PlayerCard = {
  id: string;
  player_id: string;
  event_id: string;
  card_id: string;
  awarded_at: string | null;
  cards: Card | null;
};

export default function CardsPage() {
  const [cards, setCards] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCards() {
      setLoading(true);
      setError(null);

      /*
       * Get logged-in player
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("USER ERROR:", userError);

        setError("Could not load your account.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You must be signed in to view your cards.");
        setLoading(false);
        return;
      }

      /*
       * Get cards actually owned by this player
       */
      const { data, error } = await supabase
        .from("player_cards")
        .select(`
          id,
          player_id,
          event_id,
          card_id,
          awarded_at,
          cards (
            id,
            title,
            rarity,
            description,
            accent,
            badge,
            strength,
            points,
            tag
          )
        `)
        .eq("player_id", user.id)
        .order("awarded_at", {
          ascending: false,
        });

      if (error) {
        console.error("CARD LOAD ERROR:", error);

        setError(
          `Could not load your cards: ${error.message}`
        );

        setLoading(false);
        return;
      }

      console.log("PLAYER CARDS:", data);

      setCards(
        (data ?? []) as unknown as PlayerCard[]
      );

      setLoading(false);
    }

    loadCards();
  }, []);

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      {/* HEADER */}

      <ScreenHeader eyebrow="Collection archive" title="My cards" description="Every card marks a challenge completed somewhere across Wits campus." />

      {/* LOADING */}

      {loading && (
        <ScreenSkeleton cards={3} />
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* NO CARDS */}

      {!loading && !error && cards.length === 0 && (
        <StatePanel title="Your collection starts here" description="Reach an active campus challenge and answer correctly to earn your first card." />
      )}

      {/* CARDS */}

      {!loading && !error && cards.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="text-xl font-black tracking-tight"
              style={{ color: WITS_BLUE }}
            >
              Your Collection
            </h2>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#043673] shadow-sm">
              {cards.length}{" "}
              {cards.length === 1 ? "card" : "cards"}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((playerCard) => {
              const card = playerCard.cards;

              if (!card) {
                return null;
              }

              const accent =
                card.accent ||
                (card.rarity === "Gold"
                  ? "#C9A24B"
                  : card.rarity === "Black"
                    ? "#111827"
                    : "#2563eb");

              return (
                <div
                  key={playerCard.id}
                  className="relative min-h-72 overflow-hidden rounded-2xl border border-white/20 p-5 text-white shadow-[0_22px_48px_-32px_rgba(4,54,115,.85)] transition hover:-translate-y-1 active:scale-[.99]"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, rgba(0,0,0,0.85))`,
                  }}
                >
                  {/* RARITY */}

                  <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                    {card.badge || card.rarity}
                  </div>

                  <div className="mt-10">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-white/70">
                        Wits Quest
                      </p>

                      <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/90">
                        {card.tag || "General"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight">
                      {card.title}
                    </h2>

                    {card.description && (
                      <p className="mt-2 text-sm leading-6 text-white/80">
                        {card.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">
                        Points
                      </p>

                      <p className="mt-1 text-2xl font-black">
                        {card.points}
                      </p>
                    </div>

                    <span className="text-sm text-white/80">
                      {card.strength || card.rarity}
                    </span>
                  </div>

                  {playerCard.awarded_at && (
                    <p className="mt-4 border-t border-white/15 pt-3 text-[10px] text-white/50">
                      Earned{" "}
                      {new Date(
                        playerCard.awarded_at
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
