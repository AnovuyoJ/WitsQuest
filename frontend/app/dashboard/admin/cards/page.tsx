"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";
import AlbumCoverEditor from "@/components/AlbumCoverEditor";

import { apiRequest, type EventRecord, type CardRecord } from "@/lib/api";
import { FormEvent, useEffect, useMemo, useState } from "react";
const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";


type CardRarity = "Blue" | "Black" | "Gold";

type Event = {
  id: string;
  title: string;
};

type Card = {
  id: string;
  title: string;
  rarity: CardRarity;
  description: string | null;
  accent: string | null;
  badge: string | null;
  strength: string | null;
  points: number;
  tag: string | null;
  created_at: string | null;
  event_id: string | null;
};

function getCardTheme(rarity: CardRarity) {
  if (rarity === "Gold") {
    return {
      accent: "#C9A24B",
      badge: "Gold",
      strength: "Hard",
    };
  }

  if (rarity === "Black") {
    return {
      accent: "#111827",
      badge: "Black",
      strength: "Medium",
    };
  }

  return {
    accent: "#2563EB",
    badge: "Blue",
    strength: "Easy",
  };
}

export default function AdminCardsPage() {

  const { checkingAccess, isAdmin } = useAdminAccess();

  const [events, setEvents] = useState<Event[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [selectedEvent, setSelectedEvent] =
    useState("");

  const [title, setTitle] = useState("");
  const [rarity, setRarity] =
    useState<CardRarity>("Blue");

  const [description, setDescription] =
    useState("");

  const [points, setPoints] = useState("20");
  const [tag, setTag] = useState("General");
  const tagOptions = useMemo(() => Array.from(new Set([
    "General", "History", "Wits", "Landmark",
    ...cards.map(card => card.tag?.trim() || "General"),
    tag.trim() || "General",
  ])), [cards, tag]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const theme = useMemo(
    () => getCardTheme(rarity),
    [rarity]
  );

  /*
   * -----------------------------------------
   * ADMIN ACCESS
   * -----------------------------------------
   */

  /*
   * -----------------------------------------
   * LOAD EVENTS
   * -----------------------------------------
   */

  useEffect(() => {
    if (!isAdmin) return;

    async function loadEvents() {
      const { data, error } = await apiRequest<EventRecord[]>("/admin/events");

      if (error) {
        setError(error.message);
        return;
      }

      setEvents((data ?? []) as Event[]);

      if (data && data.length > 0) {
        setSelectedEvent((current) =>
          current || data[0].id
        );
      }
    }

    loadEvents();
  }, [isAdmin]);

  /*
   * -----------------------------------------
   * LOAD CARDS
   * -----------------------------------------
   */

  useEffect(() => {
    if (!isAdmin) return;

    async function loadCards() {
      const { data, error } = await apiRequest<CardRecord[]>("/admin/cards");

      if (error) {
        setError(error.message);
        return;
      }

      setCards((data ?? []) as Card[]);
    }

    loadCards();
  }, [isAdmin]);

  /*
   * -----------------------------------------
   * RESET FORM
   * -----------------------------------------
   */

  function resetForm() {
    setTitle("");
    setRarity("Blue");
    setDescription("");
    setPoints("20");
    setTag("General");
    setEditingId(null);
  }

  /*
   * -----------------------------------------
   * CREATE / UPDATE CARD
   * -----------------------------------------
   */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    const cleanTitle = title.trim();
    const cleanDescription =
      description.trim();

    const cleanTag = tag.trim() || "General";
    const pointValue = Number(points);

    if (!selectedEvent) {
      setError("Please select an event.");
      return;
    }

    if (!cleanTitle) {
      setError("Please enter a card title.");
      return;
    }

    if (
      !Number.isInteger(pointValue) ||
      pointValue < 0 || pointValue > 100 || points.trim() === ""
    ) {
      setError(
        "Points must be a whole number from 0 to 100."
      );
      return;
    }

    const cardData = {
      event_id: selectedEvent,
      title: cleanTitle,
      rarity,
      description:
        cleanDescription || null,
      accent: theme.accent,
      badge: theme.badge,
      strength: theme.strength,
      points: pointValue,
      tag: cleanTag,
    };

    setSaving(true);

    if (editingId) {
      const { data, error } = await apiRequest<CardRecord>(`/admin/cards/${editingId}`, "PUT", cardData);

      setSaving(false);

      if (error) {
        setError(error.message);
        return;
      }

      setCards((current) =>
        current.map((card) =>
          card.id === editingId
            ? (data as Card)
            : card
        )
      );

      setMessage("Card updated successfully.");
      resetForm();
      return;
    }

    const { data, error } = await apiRequest<CardRecord>("/admin/cards", "POST", cardData);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setCards((current) => [
      data as Card,
      ...current,
    ]);

    setMessage("Card created successfully.");
    resetForm();
  }

  /*
   * -----------------------------------------
   * EDIT CARD
   * -----------------------------------------
   */

  function editCard(card: Card) {
    setEditingId(card.id);

    setSelectedEvent(card.event_id ?? "");
    setTitle(card.title);
    setRarity(card.rarity);
    setDescription(card.description ?? "");
    setPoints(String(card.points));
    setTag(card.tag?.trim() || "General");

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * -----------------------------------------
   * DELETE CARD
   * -----------------------------------------
   */

  async function deleteCard(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    const { error } = await apiRequest(`/admin/cards/${id}`, "DELETE");

    if (error) {
      setError(error.message);
      return;
    }

    setCards((current) =>
      current.filter(
        (card) => card.id !== id
      )
    );

    if (editingId === id) {
      resetForm();
    }

    setMessage("Card deleted successfully.");
  }

  /*
   * -----------------------------------------
   * FIND EVENT TITLE
   * -----------------------------------------
   */

  function getEventTitle(eventId: string | null) {
    if (!eventId) return "No event";

    return (
      events.find(
        (event) => event.id === eventId
      )?.title ?? "Unknown event"
    );
  }

  /*
   * -----------------------------------------
   * ACCESS STATE
   * -----------------------------------------
   */

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  /*
   * -----------------------------------------
   * PAGE
   * -----------------------------------------
   */

  return (
    <div className="min-h-screen space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      {/* HEADER */}

      <header className="skeuo-plate-navy p-6 sm:p-8 rounded-2xl mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: WITS_GOLD }}
        >
          Admin console
        </p>

        <h1
          className="mt-2 text-4xl font-black tracking-[-0.045em] text-white"
        >
          Cards
        </h1>

        <p className="mt-2 text-sm text-white/70">
          Create reward cards and attach them to events.
        </p>
      </header>

      {/* MESSAGES */}
      <AlbumCoverEditor events={events} />

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* CREATE CARD */}

        <form
          onSubmit={handleSubmit}
          className="skeuo-card p-6 rounded-2xl"
        >
          <div className="mb-6">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: WITS_GOLD }}
            >
              {editingId
                ? "Edit reward"
                : "New reward"}
            </p>

            <h2
              className="mt-2 text-2xl font-black tracking-tight"
              style={{ color: WITS_BLUE }}
            >
              {editingId
                ? "Update card"
                : "Create card"}
            </h2>
          </div>

          <div className="space-y-5">
            {/* EVENT */}

            <label className="block">
              <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                Event
              </span>

              <select
                value={selectedEvent}
                onChange={(e) =>
                  setSelectedEvent(
                    e.target.value
                  )
                }
                className="skeuo-input mt-2 w-full px-4 py-3 text-sm bg-white cursor-pointer outline-none"
              >
                <option value="">
                  Select event
                </option>

                {events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    {event.title}
                  </option>
                ))}
              </select>
            </label>

            {/* TITLE */}

            <label className="block">
              <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                Card title
              </span>

              <input
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Great Hall Explorer"
                className="skeuo-input mt-2 w-full px-4 py-3 text-sm outline-none"
              />
            </label>

            {/* RARITY */}

            <div>
              <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                Rarity
              </span>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    "Blue",
                    "Black",
                    "Gold",
                  ] as CardRarity[]
                ).map((item) => {
                  const selected =
                    rarity === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setRarity(item)
                      }
                      className={`px-3 py-3 text-sm font-semibold rounded-xl transition ${
                        selected
                          ? "skeuo-btn-primary"
                          : "skeuo-btn-secondary"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESCRIPTION */}

            <label className="block">
              <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                Description
              </span>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Awarded for completing the Great Hall quest."
                className="skeuo-input mt-2 min-h-28 w-full px-4 py-3 text-sm outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              {/* POINTS */}

              <label className="block">
                <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                  Battle points (0–100)
                </span>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={points}
                  onChange={(e) =>
                    setPoints(e.target.value)
                  }
                  className="skeuo-input mt-2 w-full px-4 py-3 text-sm outline-none"
                />
              </label>

              {/* TAG */}

              <label className="block">
                <span className="text-sm font-bold text-slate-700 skeuo-text-emboss">
                  Tag
                </span>

                <select
                  value={tag}
                  onChange={(e) =>
                    setTag(e.target.value)
                  }
                  className="skeuo-input mt-2 w-full px-4 py-3 text-sm bg-white cursor-pointer outline-none"
                >
                  {tagOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="skeuo-btn-primary px-5 py-3 text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update card"
                    : "Create card"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="skeuo-btn-secondary px-5 py-3 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* PREVIEW */}

        <section className="skeuo-card p-6 rounded-2xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: WITS_GOLD }}
          >
            Preview
          </p>

          <h2
            className="mt-2 text-2xl font-black tracking-tight"
            style={{ color: WITS_BLUE }}
          >
            Card preview
          </h2>

          <div
            className="relative mt-6 overflow-hidden rounded-2xl p-6 text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, rgba(0,0,0,0.88))`,
            }}
          >
            <div className="absolute right-4 top-4 rounded-full border border-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
              {theme.badge}
            </div>

            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                Wits Quest
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-tight">
                {title ||
                  "Your card title"}
              </h3>

              <p className="mt-2 text-sm text-white/75">
                {description ||
                  "Your card description will appear here."}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-sm">
                {points || "0"} pts
              </span>

              <span className="text-sm">
                {theme.strength}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* EXISTING CARDS */}

      <section className="skeuo-card p-6 rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: WITS_GOLD }}
            >
              Rewards
            </p>

            <h2
              className="mt-1 text-2xl font-black tracking-tight"
              style={{ color: WITS_BLUE }}
            >
              Existing cards
            </h2>
          </div>

          <span className="skeuo-badge-blue">
            {cards.length} cards
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="skeuo-well p-8 rounded-2xl text-center">
            <p className="text-sm text-slate-500">
              No cards have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="skeuo-card p-4 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#043673]">
                      {card.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {getEventTitle(
                        card.event_id
                      )}
                    </p>
                  </div>

                  <span className="skeuo-badge-blue text-[10px]">
                    {card.rarity}
                  </span>
                </div>

                {card.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                    {card.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {card.points} pts
                  </span>

                  <span>
                    {card.tag || "General"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      editCard(card)
                    }
                    className="skeuo-btn-secondary px-3 py-2 text-xs font-semibold rounded-lg"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteCard(card.id)
                    }
                    className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_-1px_0_rgba(0,0,0,0.04)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
