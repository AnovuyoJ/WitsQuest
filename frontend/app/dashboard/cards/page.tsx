"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

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

      <header className="mb-8">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: WITS_GOLD }}
        >
          Collection
        </p>

        <h1
          className="mt-2 font-serif text-3xl"
          style={{ color: WITS_BLUE }}
        >
          My Cards
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View the reward cards you have earned by completing
          challenges around campus.
        </p>
      </header>

      {/* LOADING */}

      {loading && (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading your collection...
          </p>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* NO CARDS */}

      {!loading && !error && cards.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center shadow-[0_2px_20px_-10px_rgba(4,54,115,0.12)]">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: `${WITS_BLUE}10`,
              color: WITS_BLUE,
            }}
          >
            <CardIcon />
          </div>

          <h2
            className="mt-5 font-serif text-xl"
            style={{ color: WITS_BLUE }}
          >
            No cards collected yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Answer a challenge correctly to earn your first card.
          </p>
        </div>
      )}

      {/* CARDS */}

      {!loading && !error && cards.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="font-serif text-xl"
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
                  className="relative overflow-hidden rounded-[24px] border border-slate-200 p-5 text-white shadow-xl"
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

                    <h2 className="mt-3 font-serif text-2xl leading-tight">
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

                      <p className="mt-1 font-serif text-2xl font-semibold">
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

function CardIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
      />

      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>
  );
}