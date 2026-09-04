"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";



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

type PlayerCardRow = {
  id: string;
  player_id: string;
  event_id: string;
  card_id: string;
  awarded_at: string | null;
  cards: Card | null;
};

type Deck = {
  category: string;
  cards: PlayerCardRow[];
};

type PendingGame = {
  id: string;
  player_one_id: string;
  player_two_id: string | null;
  category: string;
  status: "waiting" | "active";
};

export default function GamesPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [playerCards, setPlayerCards] =
    useState<PlayerCardRow[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [loadingPendingGames, setLoadingPendingGames] = useState(true);
  const [cancellingGameId, setCancellingGameId] = useState<string | null>(null);
  const [forfeitingGameId, setForfeitingGameId] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const router = useRouter();

  /*
   * --------------------------------------------------
   * LOAD LOGGED-IN PLAYER
   * --------------------------------------------------
   */

  useEffect(() => {
    async function loadPlayer() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        setError(
          "You must be signed in to play."
        );
        setLoading(false);
        return;
      }

      setPlayerId(session.user.id);
    }

    loadPlayer();
  }, []);

  /*
   * --------------------------------------------------
   * LOAD PLAYER CARDS
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!playerId) return;

    async function loadCards() {
      setLoading(true);
      setError(null);

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
        .eq("player_id", playerId)
        .order("awarded_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "PLAYER CARD ERROR:",
          error
        );

        setError(
          `Could not load your cards: ${error.message}`
        );

        setLoading(false);
        return;
      }

      setPlayerCards(
        (data ?? []) as unknown as PlayerCardRow[]
      );

      setLoading(false);
    }

    loadCards();
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;

    async function loadPendingGames() {
      setLoadingPendingGames(true);

      const { data, error } = await supabase
        .from("card_games")
        .select("id, player_one_id, player_two_id, category, status")
        .or(`player_one_id.eq.${playerId},player_two_id.eq.${playerId}`)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PENDING GAMES LOAD ERROR:", error);
        setError(`Could not load your pending games: ${error.message}`);
      } else {
        setPendingGames((data ?? []) as PendingGame[]);
      }

      setLoadingPendingGames(false);
    }

    loadPendingGames();
  }, [playerId]);

  async function cancelPendingGame(gameId: string) {
    if (!playerId) return;

    const confirmed = window.confirm(
      "Delete this pending game? Other players will no longer be able to join it."
    );

    if (!confirmed) return;

    setCancellingGameId(gameId);
    setError(null);

    const { data, error } = await supabase
      .from("card_games")
      .update({ status: "cancelled" })
      .eq("id", gameId)
      .eq("player_one_id", playerId)
      .eq("status", "waiting")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("PENDING GAME DELETE ERROR:", error);
      setError(`Could not delete the pending game: ${error.message}`);
    } else if (!data) {
      setError("This game is no longer waiting and cannot be deleted.");
    } else {
      setPendingGames((games) => games.filter((game) => game.id !== gameId));
    }

    setCancellingGameId(null);
  }

  async function forfeitGame(gameId: string) {
    const confirmed = window.confirm(
      "Quit this match? Your opponent will immediately win by forfeit."
    );

    if (!confirmed) return;

    setForfeitingGameId(gameId);
    setError(null);

    const { error } = await supabase.rpc("forfeit_card_game", {
      p_game_id: gameId,
    });

    if (error) {
      console.error("GAME FORFEIT ERROR:", error);
      setError(`Could not forfeit the game: ${error.message}`);
    } else {
      setPendingGames((games) => games.filter((game) => game.id !== gameId));
    }

    setForfeitingGameId(null);
  }

  /*
   * --------------------------------------------------
   * GROUP CARDS BY CATEGORY
   * --------------------------------------------------
   */

  const decks = useMemo<Deck[]>(() => {
    const grouped = new Map<
      string,
      PlayerCardRow[]
    >();

    playerCards.forEach((row) => {
      if (!row.cards) return;

      const category =
        row.cards.tag?.trim() ||
        "General";

      const current =
        grouped.get(category) ?? [];

      current.push(row);

      grouped.set(
        category,
        current
      );
    });

    return Array.from(
      grouped.entries()
    ).map(([category, cards]) => ({
      category,
      cards,
    }));
  }, [playerCards]);

  /*
   * --------------------------------------------------
   * CURRENT SELECTED DECK
   * --------------------------------------------------
   */

  const selectedDeck =
    decks.find(
      (deck) =>
        deck.category ===
        selectedCategory
    ) ?? null;

  /*
   * --------------------------------------------------
   * CURRENT SELECTED CARD
   * --------------------------------------------------
   */

  const selectedCard =
    selectedDeck?.cards.find(
      (row) =>
        row.id === selectedCardId
    ) ?? null;

  /*
   * --------------------------------------------------
   * CHOOSE DECK
   * --------------------------------------------------
   */

  function chooseDeck(
    category: string
  ) {
    setSelectedCategory(category);
    setSelectedCardId(null);
    setError(null);
  }

  /*
   * --------------------------------------------------
   * FIND OPPONENT
   * --------------------------------------------------
   */

  async function findOpponent() {
    if (
      !playerId ||
      !selectedCategory ||
      !selectedCard
    ) {
      setError(
        "Please choose a deck and a card first."
      );
      return;
    }

    setMatching(true);
    setError(null);

    try {
      /*
       * ----------------------------------------------
       * LOOK FOR ANOTHER WAITING PLAYER
       * ----------------------------------------------
       */

      const {
        data: waitingGames,
        error: waitingError,
      } = await supabase
        .from("card_games")
        .select(
          "id, player_one_id, category, status"
        )
        .eq(
          "category",
          selectedCategory
        )
        .eq("status", "waiting")
        .neq(
          "player_one_id",
          playerId
        )
        .order("created_at", {
          ascending: true,
        })
        .limit(1);

      if (waitingError) {
        throw waitingError;
      }

      /*
       * ----------------------------------------------
       * JOIN EXISTING GAME
       * ----------------------------------------------
       */

      if (
        waitingGames &&
        waitingGames.length > 0
      ) {
        const waitingGame =
          waitingGames[0];

        const {
          data: joinedGame,
          error: joinError,
        } = await supabase
          .from("card_games")
          .update({
            player_two_id: playerId,
            status: "active",
            started_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            waitingGame.id
          )
          .eq(
            "status",
            "waiting"
          )
          .select()
          .single();

        if (joinError) {
          throw joinError;
        }

        if (!joinedGame) {
          throw new Error(
            "The game could not be joined."
          );
        }

        /*
         * Find round 1 created
         * by Player 1.
         */
        const {
          data: existingRound,
          error: roundLookupError,
        } = await supabase
          .from("game_rounds")
          .select(
            "id, player_one_card_id, player_two_card_id"
          )
          .eq(
            "game_id",
            joinedGame.id
          )
          .eq(
            "round_number",
            1
          )
          .maybeSingle();

        if (roundLookupError) {
          throw roundLookupError;
        }

        /*
         * Normally Player 1 already created
         * round 1.
         */
        if (existingRound) {
          const {
            error:
              updateRoundError,
          } = await supabase
            .from("game_rounds")
            .update({
              player_two_card_id:
                selectedCard.card_id,
            })
            .eq(
              "id",
              existingRound.id
            );

          if (updateRoundError) {
            throw updateRoundError;
          }
        } else {
          /*
           * Fallback in case round 1
           * wasn't created.
           */
          const {
            error:
              createRoundError,
          } = await supabase
            .from("game_rounds")
            .insert({
              game_id:
                joinedGame.id,
              round_number: 1,
              player_two_card_id:
                selectedCard.card_id,
              status: "waiting",
            });

          if (createRoundError) {
            throw createRoundError;
          }
        }

        router.push(
          `/dashboard/games/${joinedGame.id}`
        );

        return;
      }

      /*
       * ----------------------------------------------
       * CREATE NEW WAITING GAME
       * ----------------------------------------------
       */

      const {
        data: newGame,
        error: createError,
      } = await supabase
        .from("card_games")
        .insert({
          player_one_id:
            playerId,
          category:
            selectedCategory,
          status: "waiting",
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (!newGame) {
        throw new Error(
          "The game could not be created."
        );
      }

      /*
       * Create round 1 and save
       * Player 1's chosen card.
       */
      const {
        error: roundError,
      } = await supabase
        .from("game_rounds")
        .insert({
          game_id: newGame.id,
          round_number: 1,
          player_one_card_id:
            selectedCard.card_id,
          status: "waiting",
        });

      if (roundError) {
        throw roundError;
      }

      /*
       * Go to waiting/battle room.
       */
      router.push(
        `/dashboard/games/${newGame.id}`
      );
    } catch (err) {
      console.error(
        "MATCHMAKING ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while finding an opponent."
      );

      setMatching(false);
    }
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading your cards...
          </p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      {/* HEADER */}

      <header className="mb-8">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{
            color: WITS_GOLD,
          }}
        >
          Wits Quest
        </p>

        <h1
          className="mt-2 font-serif text-3xl"
          style={{
            color: WITS_BLUE,
          }}
        >
          Card Battle
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Choose a category and one
          of your cards. You will be
          matched with another player
          using the same category.
          The highest point value
          wins the round.
        </p>
      </header>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EMPTY COLLECTION */}

      {playerCards.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background:
                `${WITS_BLUE}10`,
              color:
                WITS_BLUE,
            }}
          >
            <GameIcon />
          </div>

          <h2
            className="mt-5 font-serif text-xl"
            style={{
              color: WITS_BLUE,
            }}
          >
            You need cards to play
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Complete campus challenges
            and collect reward cards
            before entering a battle.
          </p>
        </section>
      ) : !selectedCategory ? (
        /*
         * =================================================
         * DECK SELECTION
         * =================================================
         */

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                Step 1
              </p>

              <h2 className="mt-1 font-serif text-2xl text-[#043673]">
                Choose your deck
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your cards are grouped
                by their category.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#043673] shadow-sm">
              {decks.length}{" "}
              {decks.length === 1
                ? "deck"
                : "decks"}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {decks.map(
              (deck) => (
                <button
                  key={
                    deck.category
                  }
                  type="button"
                  onClick={() =>
                    chooseDeck(
                      deck.category
                    )
                  }
                  className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white text-left shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)] transition hover:-translate-y-1 hover:border-[#043673]/30 hover:shadow-[0_10px_30px_-12px_rgba(4,54,115,0.28)]"
                >
                  <div
                    className="h-2"
                    style={{
                      background:
                        deck.cards[0]
                          ?.cards
                          ?.accent ??
                        WITS_BLUE,
                    }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                          Category deck
                        </p>

                        <h3 className="mt-2 font-serif text-2xl text-[#043673]">
                          {
                            deck.category
                          }
                        </h3>
                      </div>

                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
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
                      {
                        deck.cards
                          .length
                      }{" "}
                      {deck.cards
                        .length === 1
                        ? "card"
                        : "cards"}
                    </p>

                    <div className="mt-5 flex -space-x-3">
                      {deck.cards
                        .slice(0, 5)
                        .map(
                          (row) => (
                            <div
                              key={
                                row.id
                              }
                              title={
                                row.cards
                                  ?.title
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm"
                              style={{
                                background:
                                  row.cards
                                    ?.accent ??
                                  WITS_BLUE,
                              }}
                            >
                              {row.cards?.title
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>
                          )
                        )}
                    </div>

                    <div className="mt-6 text-sm font-semibold text-[#043673]">
                      Choose deck →
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </section>
      ) : (
        /*
         * =================================================
         * CARD SELECTION
         * =================================================
         */

        <section className="space-y-6">
          {/* SELECTED DECK HEADER */}

          <div className="flex flex-col gap-4 rounded-[26px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                Selected deck
              </p>

              <h2 className="mt-1 font-serif text-2xl text-[#043673]">
                {selectedCategory}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  selectedDeck
                    ?.cards.length
                }{" "}
                {selectedDeck
                  ?.cards.length ===
                1
                  ? "card"
                  : "cards"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  null
                );

                setSelectedCardId(
                  null
                );

                setError(null);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← Change deck
            </button>
          </div>

          {/* STEP 2 */}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
              Step 2
            </p>

            <h2 className="mt-1 font-serif text-2xl text-[#043673]">
              Choose a card
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the card you want
              to play in the first
              round.
            </p>
          </div>

          {/* CARD GRID */}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {selectedDeck?.cards.map(
              (row) => {
                if (!row.cards) {
                  return null;
                }

                const card =
                  row.cards;

                const selected =
                  row.id ===
                  selectedCardId;

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedCardId(
                        row.id
                      );

                      setError(
                        null
                      );
                    }}
                    className={`relative overflow-hidden rounded-[24px] border-2 p-5 text-left text-white shadow-xl transition hover:-translate-y-1 ${
                      selected
                        ? "border-[#C9A24B]"
                        : "border-transparent"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${
                        card.accent ??
                        WITS_BLUE
                      }, rgba(0,0,0,0.86))`,
                    }}
                  >
                    {/* SELECTED BADGE */}

                    {selected && (
                      <div className="absolute left-4 top-4 rounded-full bg-[#C9A24B] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">
                        Selected
                      </div>
                    )}

                    {/* RARITY */}

                    <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {
                        card.rarity
                      }
                    </div>

                    <div className="mt-10">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                        Wits Quest
                      </p>

                      <h3 className="mt-3 font-serif text-2xl">
                        {
                          card.title
                        }
                      </h3>

                      {card.description && (
                        <p className="mt-2 text-sm leading-6 text-white/75">
                          {
                            card.description
                          }
                        </p>
                      )}
                    </div>

                    <div className="mt-7 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">
                          Points
                        </p>

                        <p className="mt-1 font-serif text-3xl font-bold">
                          {
                            card.points
                          }
                        </p>
                      </div>

                      <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase">
                        {card.tag ||
                          "General"}
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* FIND OPPONENT */}

          {selectedCard && (
            <div className="rounded-[26px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.18)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                    Ready for battle
                  </p>

                  <h3 className="mt-1 font-serif text-xl text-[#043673]">
                    {
                      selectedCard
                        .cards?.title
                    }
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedCard
                        .cards?.points
                    }{" "}
                    points •{" "}
                    {
                      selectedCategory
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    findOpponent
                  }
                  disabled={
                    matching
                  }
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background:
                      WITS_BLUE,
                  }}
                >
                  {matching
                    ? "Finding opponent..."
                    : "Find Opponent"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PENDING / ACTIVE GAMES */}

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
            Your battles
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#043673]">
            Pending Games
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Return to a waiting lobby or resume a battle after an opponent joins.
          </p>
        </div>

        {loadingPendingGames ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading pending games...
          </div>
        ) : pendingGames.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            You have no pending or active games.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingGames.map((game) => {
              const waiting = game.status === "waiting";
              const canDelete = waiting && game.player_one_id === playerId;

              return (
                <article
                  key={game.id}
                  className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                        {game.category} battle
                      </p>
                      <h3 className="mt-2 font-serif text-xl text-[#043673]">
                        {waiting ? "Waiting for an opponent" : "Opponent found"}
                      </h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      waiting
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {waiting ? "Waiting" : "Ready"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/games/${game.id}`)}
                      className="rounded-xl bg-[#043673] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      {waiting ? "Return to Lobby" : "Resume Battle"}
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => cancelPendingGame(game.id)}
                        disabled={cancellingGameId === game.id}
                        className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {cancellingGameId === game.id ? "Deleting..." : "Delete"}
                      </button>
                    )}

                    {!waiting && (
                      <button
                        type="button"
                        onClick={() => forfeitGame(game.id)}
                        disabled={forfeitingGameId === game.id}
                        className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {forfeitingGameId === game.id ? "Quitting..." : "Quit Match"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/*
 * --------------------------------------------------
 * GAME ICON
 * --------------------------------------------------
 */

function GameIcon() {
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
        x="3"
        y="5"
        width="7"
        height="12"
        rx="2"
      />

      <rect
        x="14"
        y="7"
        width="7"
        height="12"
        rx="2"
      />

      <path d="m10 9 4 2" />
      <path d="m10 13 4 2" />
    </svg>
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
      width="22"
      height="22"
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
