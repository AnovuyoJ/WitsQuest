"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type Leaderboard, type LeaderboardEntry } from "@/lib/api";
import { ScreenHeader } from "@/components/WitsScreen";
import styles from "./leaderboard.module.css";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "WQ";
}

function podiumClass(rank: number | null) {
  if (rank === 1) return styles.firstPlace;
  if (rank === 2) return styles.secondPlace;
  return styles.thirdPlace;
}

function PlayerDetails({ entry }: { entry: LeaderboardEntry }) {
  return (
    <span className={styles.playerDetails}>
      <span>{entry.achievementsEarned} achievements</span>
      <span>{entry.currentStreak} day streak</span>
    </span>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await apiRequest<Leaderboard>("/leaderboard");
    if (result.data) setLeaderboard(result.data);
    else setError(result.error?.message ?? "Could not load the standings.");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const podium = leaderboard?.entries.slice(0, 3) ?? [];
  const remaining = leaderboard?.entries.slice(3) ?? [];
  const currentPlayer = leaderboard?.currentPlayer;
  const currentIsOutsideBoard = currentPlayer && !leaderboard?.entries.some((entry) => entry.playerId === currentPlayer.playerId);

  return (
    <main className={styles.page}>
      <ScreenHeader
        eyebrow="Campus competition"
        title="Leaderboard"
        description="Compare quest points, achievements and active streaks with other WitsQuest players."
      />

      <section className={styles.board} aria-labelledby="standings-heading">
        <div className={styles.boardHeader}>
          <span className={styles.headerSeal} aria-hidden="true">WQ</span>
          <div><p>Official field board</p><h2 id="standings-heading">Leaderboard</h2></div>
          <span className={styles.liveLabel}>Live totals</span>
        </div>

        {loading ? (
          <div className={styles.loadingBoard} role="status" aria-label="Loading standings">
            <div className={styles.loadingPodium}><span /><span /><span /></div>
            {[0, 1, 2, 3].map((row) => <span className={styles.loadingRow} key={row} />)}
          </div>
        ) : error ? (
          <div className={styles.statePanel} role="alert">
            <strong>Standings unavailable</strong><p>{error}</p>
            <button type="button" onClick={() => void load()}>Try again</button>
          </div>
        ) : !leaderboard?.entries.length ? (
          <div className={styles.statePanel}>
            <strong>The podium is waiting for its first player</strong>
            <p>Complete a challenge correctly to post the first score.</p>
          </div>
        ) : (
          <>
            <div className={styles.podium} aria-label="Top three players">
              {podium.map((entry) => (
                <article key={entry.playerId} className={`${styles.podiumPlayer} ${podiumClass(entry.rank)} ${entry.isCurrentPlayer ? styles.currentPodium : ""}`}>
                  {entry.rank === 1 ? <span className={styles.championBadge}>Champion</span> : null}
                  <div className={styles.podiumCard}>
                    <span className={styles.avatar} aria-hidden="true">{initials(entry.playerName)}</span>
                    <h3>{entry.playerName}</h3>
                    <strong>{entry.points.toLocaleString()}</strong>
                    <span className={styles.pointsLabel}>Quest points</span>
                    {entry.isCurrentPlayer ? <span className={styles.youLabel}>You</span> : null}
                  </div>
                  <div className={styles.podiumStep}><span>{entry.rank}</span></div>
                </article>
              ))}
            </div>

            <div className={styles.rankingPanel}>
              <div className={styles.listHeading}><span>Rank</span><span>Player</span><span>Score</span></div>
              <ol className={styles.rankList} start={4}>
                {remaining.map((entry) => (
                  <li key={entry.playerId} className={entry.isCurrentPlayer ? styles.currentRow : undefined}>
                    <span className={styles.rowRank}>{entry.rank}</span>
                    <span className={styles.rowAvatar} aria-hidden="true">{initials(entry.playerName)}</span>
                    <span className={styles.rowIdentity}>
                      <strong>{entry.playerName}{entry.isCurrentPlayer ? <span className={styles.youLabel}>You</span> : null}</strong>
                      <PlayerDetails entry={entry} />
                    </span>
                    <strong className={styles.rowPoints}>{entry.points.toLocaleString()}<small>pts</small></strong>
                  </li>
                ))}
              </ol>

              {currentIsOutsideBoard ? (
                <div className={styles.pinnedPlayer}>
                  <span className={styles.rowRank}>{currentPlayer.rank ?? "NR"}</span>
                  <span className={styles.rowAvatar} aria-hidden="true">{initials(currentPlayer.playerName)}</span>
                  <span className={styles.rowIdentity}><strong>{currentPlayer.playerName}<span className={styles.youLabel}>You</span></strong><PlayerDetails entry={currentPlayer} /></span>
                  <strong className={styles.rowPoints}>{currentPlayer.points.toLocaleString()}<small>pts</small></strong>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
      <p className={styles.rankingNote}>Ranked by quest points, then achievements and current streak.</p>
    </main>
  );
}
