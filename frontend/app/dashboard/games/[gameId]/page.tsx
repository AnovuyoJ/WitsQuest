"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ScreenSkeleton } from "@/components/WitsScreen";

const WITS_BLUE = "#043673";

type GameStatus =
  | "waiting"
  | "active"
  | "finished"
  | "cancelled";

type RoundStatus =
  | "waiting"
  | "ready"
  | "finished";

type Game = {
  id: string;
  player_one_id: string;
  player_two_id: string | null;
  category: string;
  status: GameStatus;
  winner_id: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

type Round = {
  id: string;
  game_id: string;
  round_number: number;
  player_one_card_id: string | null;
  player_two_card_id: string | null;
  player_one_points: number | null;
  player_two_points: number | null;
  winner_id: string | null;
  status: RoundStatus;
  created_at: string | null;
  finished_at: string | null;
};

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

type GamePlayerNames = {
  player_one_name: string;
  player_two_name: string | null;
};

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();

  const gameId = params.gameId as string;

  const [playerId, setPlayerId] =
    useState<string | null>(null);

  const [game, setGame] =
    useState<Game | null>(null);

  const [playerNames, setPlayerNames] =
    useState<GamePlayerNames | null>(null);

  const [round, setRound] =
    useState<Round | null>(null);

  const [myCards, setMyCards] =
    useState<PlayerCard[]>([]);

  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(null);

  const [playerOneCard, setPlayerOneCard] =
    useState<Card | null>(null);

  const [playerTwoCard, setPlayerTwoCard] =
    useState<Card | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [resolving, setResolving] =
    useState(false);

  const [startingRound, setStartingRound] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * --------------------------------------------------
   * CURRENT PLAYER
   * --------------------------------------------------
   */

  useEffect(() => {
    async function getCurrentPlayer() {
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
        router.replace("/login");
        return;
      }

      setPlayerId(session.user.id);
    }

    getCurrentPlayer();
  }, [router]);

  /*
   * --------------------------------------------------
   * LOAD GAME
   * --------------------------------------------------
   */

  const loadGame = useCallback(async () => {
    if (!playerId || !gameId) {
      return;
    }

    const { data, error } = await supabase
      .from("card_games")
      .select(
        `
        id,
        player_one_id,
        player_two_id,
        category,
        status,
        winner_id,
        created_at,
        started_at,
        finished_at
        `
      )
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("GAME LOAD ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const loadedGame = data as Game;

    /*
     * Make sure the current player belongs
     * to this game.
     */
    if (
      loadedGame.player_one_id !== playerId &&
      loadedGame.player_two_id !== playerId
    ) {
      setError(
        "You are not a player in this game."
      );

      setLoading(false);
      return;
    }

    setGame(loadedGame);
  }, [gameId, playerId]);

  /*
   * --------------------------------------------------
   * LOAD LATEST ROUND
   * --------------------------------------------------
   */

  const loadRound = useCallback(async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from("game_rounds")
      .select(
        `
        id,
        game_id,
        round_number,
        player_one_card_id,
        player_two_card_id,
        player_one_points,
        player_two_points,
        winner_id,
        status,
        created_at,
        finished_at
        `
      )
      .eq("game_id", gameId)
      .order("round_number", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "ROUND LOAD ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    setRound(
      data ? (data as Round) : null
    );
  }, [gameId]);

  /*
   * --------------------------------------------------
   * LOAD PLAYER DISPLAY NAMES
   * --------------------------------------------------
   */

  const loadPlayerNames = useCallback(async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .rpc("get_card_game_player_names", {
        p_game_id: gameId,
      })
      .maybeSingle();

    if (error) {
      console.error("PLAYER NAME LOAD ERROR:", error);
      return;
    }

    setPlayerNames(data as GamePlayerNames | null);
  }, [gameId]);

  /*
   * --------------------------------------------------
   * LOAD PLAYER'S AVAILABLE CARDS
   * --------------------------------------------------
   */

  const loadMyCards = useCallback(async () => {
    if (!playerId || !game) {
      return;
    }

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
        "PLAYER CARD LOAD ERROR:",
        error
      );

      setError(error.message);
      return;
    }

    const rows =
      (data ?? []) as unknown as PlayerCard[];

    /*
     * Only cards from the game's category
     * can be played.
     */
    const categoryCards = rows.filter(
      (row) =>
        row.cards &&
        (row.cards.tag || "General") ===
          game.category
    );

    setMyCards(categoryCards);
  }, [game, playerId]);

  /*
   * --------------------------------------------------
   * LOAD CARD DETAILS FOR THE ROUND
   * --------------------------------------------------
   */

  const loadPlayedCards =
    useCallback(async () => {
      if (!round) {
        setPlayerOneCard(null);
        setPlayerTwoCard(null);
        return;
      }

      const ids = [
        round.player_one_card_id,
        round.player_two_card_id,
      ].filter(
        (id): id is string => Boolean(id)
      );

      if (ids.length === 0) {
        setPlayerOneCard(null);
        setPlayerTwoCard(null);
        return;
      }

      const { data, error } = await supabase
        .from("cards")
        .select(
          `
          id,
          title,
          rarity,
          description,
          accent,
          badge,
          strength,
          points,
          tag
          `
        )
        .in("id", ids);

      if (error) {
        console.error(
          "PLAYED CARD LOAD ERROR:",
          error
        );

        return;
      }

      const cards =
        (data ?? []) as Card[];

      setPlayerOneCard(
        cards.find(
          (card) =>
            card.id ===
            round.player_one_card_id
        ) ?? null
      );

      setPlayerTwoCard(
        cards.find(
          (card) =>
            card.id ===
            round.player_two_card_id
        ) ?? null
      );
    }, [round]);

  /*
   * --------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!playerId) return;

    async function initialLoad() {
      setLoading(true);

      await loadGame();
      await loadRound();

      setLoading(false);
    }

    initialLoad();
  }, [
    playerId,
    loadGame,
    loadRound,
  ]);

  /*
   * Load cards once game exists.
   */
  useEffect(() => {
    if (!game || !playerId) return;

    loadMyCards();
    loadPlayerNames();
  }, [
    game,
    playerId,
    loadMyCards,
    loadPlayerNames,
  ]);

  /*
   * Load played card information
   */
  useEffect(() => {
    loadPlayedCards();
  }, [loadPlayedCards]);

  /*
   * --------------------------------------------------
   * POLL GAME WHILE WAITING
   *
   * This lets Player 1 automatically see
   * when Player 2 joins.
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!gameId || !playerId) return;

    const interval = window.setInterval(
      async () => {
        await loadGame();
        await loadRound();
      },
      2000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    gameId,
    playerId,
    loadGame,
    loadRound,
  ]);

  /*
   * --------------------------------------------------
   * PLAYER ROLE
   * --------------------------------------------------
   */

  const playerNumber = useMemo(() => {
    if (!game || !playerId) {
      return null;
    }

    if (
      game.player_one_id === playerId
    ) {
      return 1;
    }

    if (
      game.player_two_id === playerId
    ) {
      return 2;
    }

    return null;
  }, [game, playerId]);

  const playerOneName =
    playerNames?.player_one_name || "Player 1";

  const playerTwoName =
    playerNames?.player_two_name || "Player 2";

  const currentPlayerName =
    playerNumber === 1
      ? playerOneName
      : playerNumber === 2
        ? playerTwoName
        : null;

  const opponentName =
    playerNumber === 1
      ? playerTwoName
      : playerOneName;

  /*
   * Keep a server-side record of when this player was last present in the
   * battle room. The scheduled cleanup uses this to decide a fair forfeit.
   */
  useEffect(() => {
    if (!playerNumber || game?.status !== "active") return;

    async function recordPresence() {
      const { error } = await supabase.rpc("touch_card_game_presence", {
        p_game_id: gameId,
      });

      if (error) {
        console.error("GAME PRESENCE ERROR:", error);
      }
    }

    recordPresence();

    const interval = window.setInterval(recordPresence, 60_000);

    return () => window.clearInterval(interval);
  }, [game?.status, gameId, playerNumber]);

  /*
   * Has this player already submitted?
   */
  const hasSubmitted =
    playerNumber === 1
      ? Boolean(
          round?.player_one_card_id
        )
      : playerNumber === 2
        ? Boolean(
            round?.player_two_card_id
          )
        : false;

  const bothCardsSubmitted =
    Boolean(
      round?.player_one_card_id &&
        round?.player_two_card_id
    );

  /*
   * --------------------------------------------------
   * SUBMIT CARD
   * --------------------------------------------------
   */

  async function submitCard() {
    if (
      !round ||
      !selectedCardId ||
      !playerNumber
    ) {
      setError(
        "Please choose a card first."
      );
      return;
    }

    const ownedCard =
      myCards.find(
        (row) =>
          row.id === selectedCardId
      );

    if (!ownedCard?.cards) {
      setError(
        "The selected card could not be found."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const update =
      playerNumber === 1
        ? {
            player_one_card_id:
              ownedCard.card_id,
          }
        : {
            player_two_card_id:
              ownedCard.card_id,
          };

    const { error } = await supabase
      .from("game_rounds")
      .update(update)
      .eq("id", round.id);

    if (error) {
      console.error(
        "CARD SUBMIT ERROR:",
        error
      );

      setError(error.message);
      setSubmitting(false);
      return;
    }

    setSelectedCardId(null);

    await loadRound();

    setSubmitting(false);
  }

  /*
   * --------------------------------------------------
   * RESOLVE ROUND
   * --------------------------------------------------
   */

  async function resolveRound() {
    if (!round) return;

    if (!bothCardsSubmitted) {
      setError(
        "Both players must choose a card first."
      );
      return;
    }

    setResolving(true);
    setError(null);

    const { error } =
      await supabase.rpc(
        "resolve_card_game_round",
        {
          p_round_id: round.id,
        }
      );

    if (error) {
      console.error(
        "ROUND RESOLUTION ERROR:",
        error
      );

      setError(error.message);
      setResolving(false);
      return;
    }

    await loadRound();
    await loadMyCards();

    setResolving(false);
  }

  /*
   * --------------------------------------------------
   * CREATE NEXT ROUND
   * --------------------------------------------------
   */

  async function startNextRound() {
    if (!round || !game) {
      return;
    }

    setStartingRound(true);
    setError(null);

    const nextRound =
      round.round_number + 1;

    /*
     * Both players may click Next Round.
     *
     * Because (game_id, round_number)
     * is unique, maybeSingle lets us
     * check whether it already exists.
     */
    const {
      data: existing,
      error: lookupError,
    } = await supabase
      .from("game_rounds")
      .select("id")
      .eq("game_id", game.id)
      .eq(
        "round_number",
        nextRound
      )
      .maybeSingle();

    if (lookupError) {
      setError(
        lookupError.message
      );

      setStartingRound(false);
      return;
    }

    if (!existing) {
      const { error: insertError } =
        await supabase
          .from("game_rounds")
          .insert({
            game_id: game.id,
            round_number:
              nextRound,
            status: "waiting",
          });

      if (insertError) {
        /*
         * If both players clicked at
         * almost the same time, one
         * insert may lose the race.
         */
        if (
          insertError.code !== "23505"
        ) {
          setError(
            insertError.message
          );

          setStartingRound(false);
          return;
        }
      }
    }

    setSelectedCardId(null);

    await loadRound();
    await loadMyCards();

    setStartingRound(false);
  }

  /*
   * --------------------------------------------------
   * BACK TO GAMES
   * --------------------------------------------------
   */

  function leaveRoom() {
    router.push("/dashboard/games");
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
        <ScreenSkeleton cards={3} />
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR / NO GAME
   * --------------------------------------------------
   */

  if (!game) {
    return (
      <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
        <div className="rounded-2xl border border-[#043673]/12 bg-white p-8 text-center sm:p-10">
          <h1 className="text-2xl font-black tracking-tight text-[#043673]">
            Game unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "This game could not be found."}
          </p>

          <button
            type="button"
            onClick={leaveRoom}
            className="mt-6 rounded-xl bg-[#043673] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Games
          </button>
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

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A24B]">
            Card Battle
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-[#043673]">
            {game.category} Battle
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {currentPlayerName
              ? `You are ${currentPlayerName} · Playing against ${opponentName}`
              : "Battle room"}
          </p>
        </div>

        <button
          type="button"
          onClick={leaveRoom}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          ← Back to Games
        </button>
      </header>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* WAITING FOR PLAYER TWO */}

      {!game.player_two_id &&
        game.status === "waiting" && (
          <section className="rounded-2xl border border-[#043673]/12 bg-white p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#043673]/10 text-[#043673]">
              <OpponentIcon />
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight text-[#043673]">
              Waiting for an opponent
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your{" "}
              <span className="font-semibold">
                {game.category}
              </span>{" "}
              battle is open. Another
              player choosing the same
              category can join you.
            </p>

            <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#C9A24B]" />
              Searching for player
            </div>
          </section>
        )}

      {/* FORFEITED / FINISHED GAME */}

      {game.status === "finished" && (
        <section className="rounded-2xl border border-[#043673]/12 bg-white p-8 text-center sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
            Match finished
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#043673]">
            {game.winner_id === playerId
              ? "You won by forfeit"
              : `${opponentName} won by forfeit`}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            No card was transferred because the match ended before round resolution.
          </p>
          <button
            type="button"
            onClick={leaveRoom}
            className="mt-6 rounded-xl bg-[#043673] px-6 py-3 text-sm font-semibold text-white"
          >
            Back to Games
          </button>
        </section>
      )}

      {/* ACTIVE GAME */}

      {game.status === "active" && game.player_two_id && round && (
        <div className="space-y-6">
          {/* ROUND HEADER */}

          <section className="flex flex-col gap-4 rounded-2xl border border-[#043673]/12 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                Current round
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#043673]">
                Round{" "}
                {round.round_number}
              </h2>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                round.status ===
                "finished"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[#043673]/10 text-[#043673]"
              }`}
            >
              {round.status ===
              "finished"
                ? "Round complete"
                : "Battle in progress"}
            </span>
          </section>

          {/* SELECT CARD */}

          {!hasSubmitted &&
            round.status !==
              "finished" && (
              <section>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                    Your move
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#043673]">
                    Choose your card
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Only cards from the{" "}
                    {game.category} deck
                    can be used.
                  </p>
                </div>

                {myCards.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="font-semibold text-[#043673]">
                      No cards available
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      You do not currently
                      own another card in
                      this category.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {myCards.map(
                        (row) => {
                          if (!row.cards) {
                            return null;
                          }

                          const card =
                            row.cards;

                          const selected =
                            selectedCardId ===
                            row.id;

                          return (
                            <button
                              key={
                                row.id
                              }
                              type="button"
                              onClick={() =>
                                setSelectedCardId(
                                  row.id
                                )
                              }
                              className={`relative min-h-72 overflow-hidden rounded-2xl border-2 p-5 text-left text-white shadow-[0_22px_48px_-32px_rgba(4,54,115,.85)] transition hover:-translate-y-0.5 active:scale-[.99] ${
                                selected
                                  ? "border-[#C9A24B]"
                                  : "border-transparent"
                              }`}
                              style={{
                                background: `linear-gradient(135deg, ${
                                  card.accent ||
                                  WITS_BLUE
                                }, rgba(0,0,0,0.86))`,
                              }}
                            >
                              {selected && (
                                <span className="absolute left-4 top-4 rounded-full bg-[#C9A24B] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#082C58]">
                                  Selected
                                </span>
                              )}

                              <span className="absolute right-4 top-4 rounded-full border border-white/30 px-2 py-1 text-[9px] font-semibold uppercase">
                                {
                                  card.rarity
                                }
                              </span>

                              <div className="mt-10">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                                  Wits Quest
                                </p>

                                <h3 className="mt-3 text-2xl font-black tracking-tight">
                                  {
                                    card.title
                                  }
                                </h3>

                                <p className="mt-2 line-clamp-2 text-sm text-white/70">
                                  {
                                    card.description
                                  }
                                </p>
                              </div>

                              <div className="mt-7">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">
                                  Points
                                </p>

                                <p className="text-3xl font-black">
                                  {
                                    card.points
                                  }
                                </p>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>

                    {selectedCardId && (
                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={
                            submitCard
                          }
                          disabled={
                            submitting
                          }
                          className="rounded-xl bg-[#043673] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                          {submitting
                            ? "Submitting..."
                            : "Play Card"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

          {/* SUBMITTED / WAIT */}

          {hasSubmitted &&
            !bothCardsSubmitted &&
            round.status !==
              "finished" && (
              <section className="rounded-2xl border border-[#043673]/12 bg-white p-8 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043673]/10 text-[#043673]">
                  <CardIcon />
                </div>

                <h2 className="mt-5 text-xl font-black tracking-tight text-[#043673]">
                  Card submitted
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Waiting for your
                  opponent to choose
                  their card.
                </p>
              </section>
            )}

          {/* BOTH CARDS READY */}

          {bothCardsSubmitted && (
            <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
              <div className="mb-6 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
                  Battle
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#043673]">
                  Card Reveal
                </h2>
              </div>

              <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                <BattleCard
                  title={playerOneName}
                  card={
                    playerOneCard
                  }
                  points={
                    round.player_one_points
                  }
                  winner={
                    round.status ===
                      "finished" &&
                    round.winner_id ===
                      game.player_one_id
                  }
                  hidden={round.status !== "finished" && playerNumber !== 1}
                />

                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#043673] font-bold text-white shadow-lg">
                    VS
                  </div>
                </div>

                <BattleCard
                  title={playerTwoName}
                  card={
                    playerTwoCard
                  }
                  points={
                    round.player_two_points
                  }
                  winner={
                    round.status ===
                      "finished" &&
                    round.winner_id ===
                      game.player_two_id
                  }
                  hidden={round.status !== "finished" && playerNumber !== 2}
                />
              </div>

              {/* RESOLVE */}

              {round.status !==
                "finished" && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={
                      resolveRound
                    }
                    disabled={
                      resolving
                    }
                    className="rounded-xl bg-[#043673] px-7 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {resolving
                      ? "Comparing cards..."
                      : "Reveal Winner"}
                  </button>
                </div>
              )}

              {/* RESULT */}

              {round.status ===
                "finished" && (
                <div className="mt-8">
                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    {round.winner_id ===
                    null ? (
                      <>
                        <p className="text-2xl font-black tracking-tight text-[#043673]">
                          Draw!
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Both cards have
                          the same number of
                          points. Each player
                          keeps their card.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                          Round winner
                        </p>

                        <h3 className="mt-2 text-2xl font-black tracking-tight text-[#043673]">
                          {round.winner_id ===
                          playerId
                            ? "You won!"
                            : `${opponentName} won`}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {round.winner_id ===
                          playerId
                            ? "You keep your card and take your opponent's card."
                            : "Your opponent keeps their card and takes yours."}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={
                        startNextRound
                      }
                      disabled={
                        startingRound
                      }
                      className="rounded-xl bg-[#C9A24B] px-6 py-3 text-sm font-bold text-[#082C58] transition hover:brightness-105 active:scale-[.98] disabled:opacity-60"
                    >
                      {startingRound
                        ? "Starting..."
                        : "Next Round"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * --------------------------------------------------
 * BATTLE CARD
 * --------------------------------------------------
 */

function BattleCard({
  title,
  card,
  points,
  winner,
  hidden,
}: {
  title: string;
  card: Card | null;
  points: number | null;
  winner: boolean;
  hidden: boolean;
}) {
  if (hidden) {
    return (
      <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border-2 border-[#C9A24B]/60 bg-[#043673] p-6 text-white shadow-[0_22px_48px_-32px_rgba(4,54,115,.85)]">
        <div className="absolute inset-3 rounded-[20px] border border-white/20" />
        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A24B]/60 bg-white/10 text-xl font-black text-[#C9A24B]">
            WQ
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight">Hidden Card</p>
          <p className="mt-2 text-sm text-white/60">Revealed when the round is resolved</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">
          Card loading...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-6 text-white shadow-[0_22px_48px_-32px_rgba(4,54,115,.85)] ${
        winner
          ? "border-[#C9A24B]"
          : "border-transparent"
      }`}
      style={{
        background: `linear-gradient(135deg, ${
          card.accent || WITS_BLUE
        }, rgba(0,0,0,0.88))`,
      }}
    >
      {winner && (
        <div className="absolute left-4 top-4 rounded-full bg-[#C9A24B] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">
          Winner
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-full border border-white/30 px-2.5 py-1 text-[9px] font-bold uppercase">
        {card.rarity}
      </div>

      <div className="mt-10">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">
          {title}
        </p>

        <h3 className="mt-3 text-2xl font-black tracking-tight">
          {card.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/70">
          {card.description}
        </p>
      </div>

      <div className="mt-7 rounded-xl border border-white/20 bg-white/10 p-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
          Points
        </p>

        <p className="mt-1 text-4xl font-black">
          {points ?? card.points}
        </p>
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * ICONS
 * --------------------------------------------------
 */

function OpponentIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
    </svg>
  );
}
