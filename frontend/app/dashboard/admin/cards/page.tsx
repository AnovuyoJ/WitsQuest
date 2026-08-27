"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "AnovuyoJ";

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

function getGitHubUsernameCandidates(user: User | null | undefined): string[] {
  if (!user) return [];

  const values = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.login,
    user?.user_metadata?.preferred_username,
    user?.user_metadata?.name,
    user?.email?.split("@")[0],

    user?.identities?.map((identity) => identity?.identity_data?.user_name),

    user?.identities?.map((identity) => identity?.identity_data?.login),

    user?.identities?.map(
      (identity) => identity?.identity_data?.preferred_username
    ),
  ];

  return values
    .flat()
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .map((value) => value.trim())
    .filter(Boolean);
}

function isAdminGitHubUser(user: User | null| undefined) {
  if (!user) return false;

  const candidates =
    getGitHubUsernameCandidates(user).map((value) =>
      value.toLowerCase()
    );

  return candidates.includes(
    ADMIN_GITHUB_USERNAME.toLowerCase()
  );
}

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
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        if (!mounted) return;

        setCheckingAccess(false);
        setIsAdmin(false);

        router.replace("/dashboard");
        return;
      }

      const adminAccess =
        isAdminGitHubUser(user);

      if (!mounted) return;

      setIsAdmin(adminAccess);
      setCheckingAccess(false);

      if (!adminAccess) {
        router.replace("/dashboard");
      }
    }

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        if (!user) {
          setIsAdmin(false);
          setCheckingAccess(false);
          router.replace("/dashboard");
          return;
        }

        const adminAccess =
          isAdminGitHubUser(user);

        setIsAdmin(adminAccess);
        setCheckingAccess(false);

        if (!adminAccess) {
          router.replace("/dashboard");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /*
   * -----------------------------------------
   * LOAD EVENTS
   * -----------------------------------------
   */

  useEffect(() => {
    if (!isAdmin) return;

    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("id,title")
        .order("created_at", {
          ascending: false,
        });

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
      const { data, error } = await supabase
        .from("cards")
        .select(
          "id,title,rarity,description,accent,badge,strength,points,tag,created_at,event_id"
        )
        .order("created_at", {
          ascending: false,
        });

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
      Number.isNaN(pointValue) ||
      pointValue < 0
    ) {
      setError(
        "Points must be a valid number."
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
      const { data, error } = await supabase
        .from("cards")
        .update(cardData)
        .eq("id", editingId)
        .select()
        .single();

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

    const { data, error } = await supabase
      .from("cards")
      .insert(cardData)
      .select()
      .single();

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
    setTag(card.tag ?? "General");

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

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", id);

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
    <div className="space-y-8 p-4 md:p-6">
      {/* HEADER */}

      <header>
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: WITS_GOLD }}
        >
          Admin console
        </p>

        <h1
          className="mt-2 font-serif text-3xl"
          style={{ color: WITS_BLUE }}
        >
          Cards
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create reward cards and attach them to events.
        </p>
      </header>

      {/* MESSAGES */}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* CREATE CARD */}

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]"
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
              className="mt-2 font-serif text-2xl"
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
              <span className="text-sm font-semibold text-slate-700">
                Event
              </span>

              <select
                value={selectedEvent}
                onChange={(e) =>
                  setSelectedEvent(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
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
              <span className="text-sm font-semibold text-slate-700">
                Card title
              </span>

              <input
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Great Hall Explorer"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
              />
            </label>

            {/* RARITY */}

            <div>
              <span className="text-sm font-semibold text-slate-700">
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
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        selected
                          ? "border-[#043673] bg-[#043673] text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
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
              <span className="text-sm font-semibold text-slate-700">
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
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              {/* POINTS */}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Points
                </span>

                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) =>
                    setPoints(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                />
              </label>

              {/* TAG */}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Tag
                </span>

                <input
                  value={tag}
                  onChange={(e) =>
                    setTag(e.target.value)
                  }
                  placeholder="History"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                style={{
                  background: WITS_BLUE,
                }}
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
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* PREVIEW */}

        <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: WITS_GOLD }}
          >
            Preview
          </p>

          <h2
            className="mt-2 font-serif text-2xl"
            style={{ color: WITS_BLUE }}
          >
            Card preview
          </h2>

          <div
            className="relative mt-6 overflow-hidden rounded-[26px] p-6 text-white shadow-xl"
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

              <h3 className="mt-3 font-serif text-2xl">
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

      <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: WITS_GOLD }}
            >
              Rewards
            </p>

            <h2
              className="mt-1 font-serif text-2xl"
              style={{ color: WITS_BLUE }}
            >
              Existing cards
            </h2>
          </div>

          <span className="rounded-full bg-[#043673]/5 px-3 py-1 text-xs font-semibold text-[#043673]">
            {cards.length} cards
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              No cards have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-[#043673]">
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
                    className="rounded-lg border border-[#043673]/15 bg-white px-3 py-2 text-xs font-semibold text-[#043673]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteCard(card.id)
                    }
                    className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500"
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