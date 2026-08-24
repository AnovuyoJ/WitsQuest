"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCardThemeByRarity,
  getCardTierByPoints,
  loadSavedChallenges,
  saveSavedChallenges,
  type SavedChallenge,
  type SavedChallengeCard,
} from "@/lib/adminChallenges";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

export default function AdminCardsPage() {
  const [savedChallenges, setSavedChallenges] = useState<SavedChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [cardTitle, setCardTitle] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const challenges = loadSavedChallenges();
    setSavedChallenges(challenges);
    setSelectedChallengeId((current) => {
      if (current && challenges.some((challenge) => challenge.id === current)) {
        return current;
      }

      return challenges[0]?.id ?? "";
    });
  }, []);

  const pendingChallenges = useMemo(
    () => savedChallenges.filter((challenge) => !challenge.published),
    [savedChallenges]
  );

  const publishedChallenges = useMemo(
    () => savedChallenges.filter((challenge) => challenge.published),
    [savedChallenges]
  );

  const selectedChallenge = useMemo(
    () => savedChallenges.find((challenge) => challenge.id === selectedChallengeId) ?? null,
    [savedChallenges, selectedChallengeId]
  );

  useEffect(() => {
    if (!selectedChallenge) {
      return;
    }

    setCardTitle(selectedChallenge.card?.title ?? selectedChallenge.title);
    setCardDescription(selectedChallenge.card?.description ?? selectedChallenge.description);
  }, [selectedChallenge]);

  const cardPreview = useMemo(() => {
    if (!selectedChallenge) return null;

    const points = selectedChallenge.points || 20;
    const rarity = getCardTierByPoints(points);
    const theme = getCardThemeByRarity(rarity);

    return {
      rarity,
      points,
      title: cardTitle.trim() || selectedChallenge.title,
      description: cardDescription.trim() || selectedChallenge.description,
      accent: theme.accent,
      badge: theme.badge,
      strength: theme.strength,
      tag: selectedChallenge.category || "General",
    };
  }, [cardDescription, cardTitle, selectedChallenge]);

  function handleCreateCard() {
    if (!selectedChallenge) {
      setMessage("Please select an event first.");
      return;
    }

    const title = cardTitle.trim() || selectedChallenge.title;
    const description = cardDescription.trim() || selectedChallenge.description;
    const points = Number(selectedChallenge.points) || 20;
    const rarity = getCardTierByPoints(points);
    const theme = getCardThemeByRarity(rarity);

    const card: SavedChallengeCard = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`,
      eventId: selectedChallenge.id,
      title,
      rarity,
      description,
      accent: theme.accent,
      badge: theme.badge,
      strength: theme.strength,
      points,
      tag: selectedChallenge.category || "General",
    };

    const nextChallenges = loadSavedChallenges().map((challenge) =>
      challenge.id === selectedChallenge.id
        ? { ...challenge, card, published: selectedChallenge.published }
        : challenge
    );

    saveSavedChallenges(nextChallenges);
    setSavedChallenges(nextChallenges);
    setMessage(`Card defined for ${selectedChallenge.title}. Now publish it to the map when you're ready.`);
  }

  function handlePublishToMap() {
    if (!selectedChallenge) {
      setMessage("Select a challenge before publishing.");
      return;
    }

    if (!selectedChallenge.card) {
      setMessage("Create a card for this event before publishing it to the map.");
      return;
    }

    const nextChallenges = loadSavedChallenges().map((challenge) =>
      challenge.id === selectedChallenge.id
        ? { ...challenge, published: true }
        : challenge
    );

    saveSavedChallenges(nextChallenges);
    setSavedChallenges(nextChallenges);
    setMessage(`${selectedChallenge.title} is now published to the map.`);
  }

  const publishedCount = savedChallenges.filter((challenge) => challenge.published && challenge.card).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: WITS_GOLD }}>
            Admin console
          </p>
          <h1 className="mt-2 font-serif text-3xl" style={{ color: WITS_BLUE }}>
            Card creation studio
          </h1>
        </div>

        <div className="rounded-full border border-[#043673]/15 bg-white px-4 py-2 text-sm font-medium text-[#043673] shadow-sm">
          Published to map: {publishedCount}
        </div>
      </header>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#043673]">Pending events</h2>
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: WITS_GOLD }}>
              {pendingChallenges.length}
            </span>
          </div>

          {pendingChallenges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              No pending events. Publish a card to move it to the published list.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingChallenges.map((challenge) => {
                const isSelected = challenge.id === selectedChallengeId;

                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#043673] bg-[#043673]/5"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#043673]">{challenge.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{challenge.location}</p>
                      </div>

                      <div className="text-right text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Draft
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{challenge.points} pts</span>
                      <span className="rounded-full border border-[#043673]/15 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#043673]">
                        {challenge.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#043673]">Published event list</h2>
              <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: WITS_GOLD }}>
                {publishedChallenges.length}
              </span>
            </div>

            {publishedChallenges.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                No published events yet.
              </div>
            ) : (
              <div className="space-y-2">
                {publishedChallenges.map((challenge) => {
                  const isSelected = challenge.id === selectedChallengeId;

                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => setSelectedChallengeId(challenge.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "border-[#043673] bg-[#043673]/5 text-[#043673]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{challenge.title}</span>
                        <span className="mt-1 inline-flex rounded-full border border-[#043673]/10 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#043673]">
                          {challenge.category}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {challenge.points} pts
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          {selectedChallenge ? (
            <>
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl text-[#043673]">Card definition</h2>
                <span className="rounded-full bg-[#043673]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#043673]">
                  {selectedChallenge.points} pts
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Card title
                  <input
                    value={cardTitle}
                    onChange={(event) => setCardTitle(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                    placeholder={selectedChallenge.title}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Card description
                  <textarea
                    value={cardDescription}
                    onChange={(event) => setCardDescription(event.target.value)}
                    className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                    placeholder={selectedChallenge.description}
                  />
                </label>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Card preview
                </p>

                {cardPreview && (
                  <div
                    className="relative overflow-hidden rounded-[24px] border border-slate-200 p-5 text-white shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${cardPreview.accent}, rgba(0,0,0,0.85))` }}
                  >
                    <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                      {cardPreview.badge}
                    </div>
                    <div className="mt-10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-[0.32em] text-white/70">Wits Quest</p>
                        <span className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/90">
                          {cardPreview.tag}
                        </span>
                      </div>
                      <h3 className="mt-2 font-serif text-2xl leading-tight">{cardPreview.title}</h3>
                      <p className="mt-2 max-w-xs text-sm text-white/80">{cardPreview.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span>{cardPreview.points} pts</span>
                      <span>{cardPreview.strength}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCreateCard}
                  className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  style={{ background: WITS_BLUE }}
                >
                  Save card
                </button>

                <button
                  type="button"
                  onClick={handlePublishToMap}
                  className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  style={{ background: WITS_GOLD }}
                >
                  Publish to map
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              Select an event to define its card.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
