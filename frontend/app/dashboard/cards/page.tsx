"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COLLECTED_CARDS_UPDATED_EVENT,
  loadCollectedCards,
  type CollectedCard,
} from "@/lib/adminChallenges";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type GroupBy = "tag" | "rarity";
type CompareAttribute = "points" | "rarity" | "strength";

const rarityScore = {
  Blue: 1,
  Black: 2,
  Gold: 3,
};

const strengthScore: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

export default function CardsPage() {
  const [cards, setCards] = useState<CollectedCard[]>([]);

  const [groupBy, setGroupBy] =
    useState<GroupBy>("tag");

  const [selectedDeck, setSelectedDeck] =
    useState<string | null>(null);

  const [compareAttribute, setCompareAttribute] =
    useState<CompareAttribute>("points");

  const [round, setRound] = useState(0);

  useEffect(() => {
    const syncCards = () =>
      setCards(loadCollectedCards());

    syncCards();

    window.addEventListener(
      COLLECTED_CARDS_UPDATED_EVENT,
      syncCards
    );

    return () => {
      window.removeEventListener(
        COLLECTED_CARDS_UPDATED_EVENT,
        syncCards
      );
    };
  }, []);

  /*
   * --------------------------------------------------
   * CREATE DECKS
   * --------------------------------------------------
   */

  const decks = useMemo(() => {
    const grouped: Record<
      string,
      CollectedCard[]
    > = {};

    cards.forEach((card) => {
      const key =
        groupBy === "tag"
          ? card.tag || "General"
          : card.rarity;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(card);
    });

    return grouped;
  }, [cards, groupBy]);

  const selectedDeckCards =
    selectedDeck && decks[selectedDeck]
      ? decks[selectedDeck]
      : [];

  /*
   * --------------------------------------------------
   * ROUND COMPARISON
   * --------------------------------------------------
   */

  const currentCard =
    selectedDeckCards.length > 0
      ? selectedDeckCards[
          round % selectedDeckCards.length
        ]
      : null;

  const opponentCard =
    selectedDeckCards.length > 1
      ? selectedDeckCards[
          (round + 1) %
            selectedDeckCards.length
        ]
      : null;

  function getComparisonValue(
    card: CollectedCard,
    attribute: CompareAttribute
  ) {
    if (attribute === "points") {
      return card.points;
    }

    if (attribute === "rarity") {
      return rarityScore[card.rarity] ?? 0;
    }

    return strengthScore[card.strength] ?? 0;
  }

  function getWinner() {
    if (!currentCard || !opponentCard) {
      return null;
    }

    const firstValue =
      getComparisonValue(
        currentCard,
        compareAttribute
      );

    const secondValue =
      getComparisonValue(
        opponentCard,
        compareAttribute
      );

    if (firstValue > secondValue) {
      return currentCard.id;
    }

    if (secondValue > firstValue) {
      return opponentCard.id;
    }

    return "draw";
  }

  const winner = getWinner();

  function nextRound() {
    setRound((current) => current + 1);
  }

  function openDeck(name: string) {
    setSelectedDeck(name);
    setRound(0);
  }

  function closeDeck() {
    setSelectedDeck(null);
    setRound(0);
  }

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      {/* HEADER */}

      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A24B]">
          Collection
        </p>

        <h1 className="mt-2 font-serif text-3xl text-[#043673]">
          My Cards
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Build decks from the cards you have earned
          and compare their attributes round by round.
        </p>
      </header>

      {/* NO CARDS */}

      {cards.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center shadow-[0_2px_20px_-10px_rgba(4,54,115,0.12)]">
          <p className="font-serif text-xl text-[#043673]">
            Your collection is empty
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Complete a challenge correctly to earn
            your first card.
          </p>
        </div>
      ) : selectedDeck ? (
        /*
         * ==================================================
         * SELECTED DECK
         * ==================================================
         */

        <div className="space-y-6">
          {/* Deck Header */}

          <section className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
                Selected deck
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#043673]">
                {selectedDeck}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedDeckCards.length}{" "}
                {selectedDeckCards.length === 1
                  ? "card"
                  : "cards"}
              </p>
            </div>

            <button
              type="button"
              onClick={closeDeck}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← Back to decks
            </button>
          </section>

          {/* COMPARISON */}

          {selectedDeckCards.length < 2 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-semibold text-[#043673]">
                More cards needed
              </p>

              <p className="mt-2 text-sm text-slate-500">
                This deck needs at least two cards
                before you can compare them.
              </p>
            </div>
          ) : (
            <section className="rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
                    Card battle
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-[#043673]">
                    Round {round + 1}
                  </h2>
                </div>

                <label className="text-sm font-medium text-slate-600">
                  Compare by

                  <select
                    value={compareAttribute}
                    onChange={(event) =>
                      setCompareAttribute(
                        event.target
                          .value as CompareAttribute
                      )
                    }
                    className="ml-3 rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-[#043673]"
                  >
                    <option value="points">
                      Points
                    </option>

                    <option value="rarity">
                      Rarity
                    </option>

                    <option value="strength">
                      Strength
                    </option>
                  </select>
                </label>
              </div>

              {/* TWO CARDS */}

              <div className="mt-8 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                {currentCard && (
                  <ComparisonCard
                    card={currentCard}
                    attribute={
                      compareAttribute
                    }
                    winner={
                      winner === currentCard.id
                    }
                  />
                )}

                <div className="flex items-center justify-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                    style={{
                      background: WITS_BLUE,
                    }}
                  >
                    VS
                  </div>
                </div>

                {opponentCard && (
                  <ComparisonCard
                    card={opponentCard}
                    attribute={
                      compareAttribute
                    }
                    winner={
                      winner ===
                      opponentCard.id
                    }
                  />
                )}
              </div>

              {/* RESULT */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
                {winner === "draw" ? (
                  <p className="font-semibold text-slate-600">
                    This round is a draw.
                  </p>
                ) : winner ? (
                  <p
                    className="font-semibold"
                    style={{
                      color: WITS_BLUE,
                    }}
                  >
                    {winner === currentCard?.id
                      ? currentCard?.title
                      : opponentCard?.title}{" "}
                    wins this round!
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  style={{
                    background: WITS_BLUE,
                  }}
                >
                  Next Round
                </button>
              </div>
            </section>
          )}

          {/* CARDS IN DECK */}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#043673]">
                Cards in this deck
              </h2>

              <span className="text-xs font-semibold text-slate-400">
                {selectedDeckCards.length}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {selectedDeckCards.map(
                (card) => (
                  <CollectedCardView
                    key={card.id}
                    card={card}
                  />
                )
              )}
            </div>
          </section>
        </div>
      ) : (
        /*
         * ==================================================
         * DECK LIST
         * ==================================================
         */

        <>
          {/* GROUPING OPTIONS */}

          <section className="mb-6 rounded-[24px] bg-white p-5 shadow-[0_2px_20px_-10px_rgba(4,54,115,0.15)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl text-[#043673]">
                  My Decks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose how your cards should be
                  grouped.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setGroupBy("tag")
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    groupBy === "tag"
                      ? "bg-white text-[#043673] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  By Tag
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setGroupBy("rarity")
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    groupBy === "rarity"
                      ? "bg-white text-[#043673] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  By Rarity
                </button>
              </div>
            </div>
          </section>

          {/* DECKS */}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(decks).map(
              ([deckName, deckCards]) => (
                <button
                  key={deckName}
                  type="button"
                  onClick={() =>
                    openDeck(deckName)
                  }
                  className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white text-left shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)] transition-all hover:-translate-y-1 hover:border-[#043673]/30 hover:shadow-[0_10px_30px_-12px_rgba(4,54,115,0.28)]"
                >
                  <div
                    className="h-2"
                    style={{
                      background:
                        deckCards[0]
                          ?.accent ||
                        WITS_BLUE,
                    }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#C9A24B]">
                          {groupBy === "tag"
                            ? "Tag deck"
                            : "Rarity deck"}
                        </p>

                        <h3 className="mt-2 font-serif text-2xl text-[#043673]">
                          {deckName}
                        </h3>
                      </div>

                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                          background:
                            `${WITS_BLUE}10`,
                          color:
                            WITS_BLUE,
                        }}
                      >
                        <DeckIcon />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      {deckCards.length}{" "}
                      {deckCards.length ===
                      1
                        ? "card"
                        : "cards"}{" "}
                      in this deck.
                    </p>

                    <div className="mt-5 flex -space-x-3">
                      {deckCards
                        .slice(0, 4)
                        .map((card) => (
                          <div
                            key={
                              card.id
                            }
                            title={
                              card.title
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow"
                            style={{
                              background:
                                card.accent,
                            }}
                          >
                            {card.title
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        ))}

                      {deckCards.length >
                        4 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
                          +
                          {deckCards.length -
                            4}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 text-sm font-semibold text-[#043673]">
                      Open deck →
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

/*
 * --------------------------------------------------
 * CARD DISPLAY
 * --------------------------------------------------
 */

function CollectedCardView({
  card,
}: {
  card: CollectedCard;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-slate-200 p-5 text-white shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${card.accent}, rgba(0,0,0,0.85))`,
      }}
    >
      <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
        {card.badge}
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

        <p className="mt-2 text-sm text-white/80">
          {card.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span>{card.points} pts</span>
        <span>{card.strength}</span>
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * COMPARISON CARD
 * --------------------------------------------------
 */

function ComparisonCard({
  card,
  attribute,
  winner,
}: {
  card: CollectedCard;
  attribute: CompareAttribute;
  winner: boolean;
}) {
  let displayedValue: string | number;

  if (attribute === "points") {
    displayedValue = card.points;
  } else if (attribute === "rarity") {
    displayedValue = card.rarity;
  } else {
    displayedValue = card.strength;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border-2 p-6 text-white shadow-xl transition ${
        winner
          ? "border-[#C9A24B]"
          : "border-transparent"
      }`}
      style={{
        background: `linear-gradient(135deg, ${card.accent}, rgba(0,0,0,0.88))`,
      }}
    >
      {winner && (
        <div className="absolute left-4 top-4 rounded-full bg-[#C9A24B] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
          Round winner
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
        {card.badge}
      </div>

      <div className="mt-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
          Wits Quest
        </p>

        <h3 className="mt-3 font-serif text-2xl">
          {card.title}
        </h3>

        <p className="mt-2 text-sm text-white/75">
          {card.description}
        </p>
      </div>

      <div className="mt-7 rounded-xl border border-white/20 bg-white/10 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {attribute}
        </p>

        <p className="mt-1 font-serif text-2xl">
          {displayedValue}
        </p>
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * DECK ICON
 * --------------------------------------------------
 */

function DeckIcon() {
  return (
    <svg
      width="20"
      height="20"
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
        y="4"
        width="13"
        height="16"
        rx="2"
      />

      <path d="M9 1h9a2 2 0 0 1 2 2v13" />
      <path d="M2 8v10a3 3 0 0 0 3 3h9" />
    </svg>
  );
}