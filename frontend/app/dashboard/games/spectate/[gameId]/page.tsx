"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ScreenHeader, ScreenSkeleton } from "@/components/WitsScreen";

type Card = { title: string; points: number };
type SpectatorRound = {
  id: string; round_number: number; status: "waiting" | "finished"; winner_side: number | null;
  player_one_submitted: boolean; player_two_submitted: boolean;
  player_one_card: Card | null; player_two_card: Card | null;
};
type SpectatorState = {
  game: { id: string; status: string; is_cpu: boolean; started_at: string | null; player_one_name: string; player_two_name: string; winner_side: number | null };
  rounds: SpectatorRound[];
  scores: { one: number; two: number };
};

export default function SpectateMatchPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [state, setState] = useState<SpectatorState | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await apiRequest<SpectatorState>(`/games/${gameId}/spectate`);
    if (result.error || !result.data) {
      setState(null);
      setError(result.error?.message || "This match is no longer available to watch.");
      return false;
    }
    setState(result.data);
    setError("");
    return result.data.game.status !== "finished";
  }, [gameId]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      const stillLive = await load();
      if (active && stillLive) timeout = setTimeout(poll, 2500);
    }
    void poll();
    return () => { active = false; if (timeout) clearTimeout(timeout); };
  }, [load]);

  if (!state && !error) return <div className="p-8"><ScreenSkeleton /></div>;
  if (!state) return <main className="mx-auto max-w-3xl p-8"><p role="alert" className="skeuo-well p-6 text-slate-700">{error} <Link href="/dashboard/games" className="font-bold text-[#043673] underline underline-offset-2">Back to Games</Link></p></main>;

  const currentRound = state.rounds.at(-1);
  const isFinished = state.game.status === "finished";

  let matchOutcome = "Match drawn";
  if (state.game.winner_side === 1) matchOutcome = `${state.game.player_one_name} won the match!`;
  if (state.game.winner_side === 2) matchOutcome = `${state.game.player_two_name} won the match!`;

  const roundMessage = !currentRound || currentRound.status === "finished"
    ? "Waiting for the next round…"
    : currentRound.player_one_submitted && currentRound.player_two_submitted
      ? "Cards are being revealed…"
      : currentRound.player_one_submitted || currentRound.player_two_submitted
        ? "One player has locked in a card…"
        : "Both players are choosing a card…";

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 md:px-10">
      <ScreenHeader eyebrow="Spectator gallery" title={state.game.is_cpu ? "Live CPU match" : "Live player match"} description={`${state.game.player_one_name} vs ${state.game.player_two_name}. ${isFinished ? "Match has ended." : "Updates appear automatically."}`} action={<Link href="/dashboard/games" className="text-sm font-semibold text-[#043673] underline">Back to Games</Link>} />

      {isFinished ? (
        <section className="mt-6 skeuo-plate-gold p-6 rounded-2xl flex flex-col items-center text-center shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#76561C] skeuo-text-deboss mb-2">Match Over</p>
          <h2 className="text-3xl font-black text-[#76561C] skeuo-text-emboss">{matchOutcome}</h2>
          <p className="mt-2 text-[#76561C]/80 font-semibold mb-6">
            Final Score: {state.game.player_one_name} {state.scores.one} – {state.scores.two} {state.game.player_two_name}
          </p>
          <Link href="/dashboard/games" className="skeuo-btn-primary px-6 py-3 rounded-xl font-bold text-sm">
            Return to Games
          </Link>
        </section>
      ) : (
        <section className="mt-6 skeuo-card p-5 rounded-2xl" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-black text-[#043673]">{state.game.player_one_name} <span className="text-[#C9A24B]">{state.scores.one} – {state.scores.two}</span> {state.game.player_two_name}</p>
            <span className="skeuo-badge-emerald">● Watching live</span>
          </div>
          <p className="mt-3 skeuo-well px-4 py-3 text-sm font-semibold text-slate-700">{roundMessage}</p>
        </section>
      )}

      <section className="mt-6 skeuo-card p-5 rounded-2xl" aria-labelledby="round-history">
        <h2 id="round-history" className="text-xl font-black text-[#043673]">Round history</h2>
        <ol className="mt-4 space-y-3">
          {state.rounds.map((round) => round.status === "finished" ? (
            <li key={round.id} className="skeuo-well p-4 text-sm rounded-xl border border-slate-200">
              <p className="font-bold text-[#043673]">Round {round.round_number}</p>
              <p className="mt-1 text-slate-700">{round.player_one_card?.title} ({round.player_one_card?.points}) vs {round.player_two_card?.title} ({round.player_two_card?.points})</p>
              <p className="mt-1 text-slate-500">{round.winner_side === null ? "Round drawn" : `${round.winner_side === 1 ? state.game.player_one_name : state.game.player_two_name} wins the round`}</p>
            </li>
          ) : (
            <li key={round.id} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Round {round.round_number} is in progress. Card choices remain hidden until both players have committed.</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
