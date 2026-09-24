"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ForwardArrowIcon from "@/components/ForwardArrowIcon";
import { ScreenHeader } from "@/components/WitsScreen";
import { apiRequest } from "@/lib/api";
import { type Trail } from "@/lib/trails";
import styles from "./trails.module.css";

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await apiRequest<Trail[]>("/trails");
    setError(result.error?.message ?? "");
    if (result.data) setTrails(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className={styles.page}>
      <ScreenHeader
        eyebrow="Guided adventures"
        title="Campus trails"
        description="Follow a series of quests in order. Complete each stop's questions to progress; other quests remain open to explore."
      />

      <div className={styles.controlBar}>
        <div className={styles.controlLabel}>
          <span className={styles.statusLight} aria-hidden="true" /> Trail log
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className={styles.refreshButton}>
          <span className={loading ? styles.refreshingIcon : styles.refreshIcon} aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh progress"}
        </button>
      </div>

      {error ? (
        <div role="alert" className={styles.errorPanel}>
          <span className={styles.alertMark} aria-hidden="true">!</span>
          <div><strong>Trail log unavailable</strong><p>{error}</p></div>
        </div>
      ) : null}

      {loading && trails.length === 0 ? (
        <div className={styles.loadingGrid} aria-label="Loading campus trails" aria-busy="true">
          {[0, 1].map((item) => <div className={styles.loadingFolio} key={item}><span className={styles.loadingTitle} /><span className={styles.loadingLine} /><span className={styles.loadingTrack} /></div>)}
        </div>
      ) : null}

      {!loading && !error && trails.length === 0 ? (
        <section className={styles.emptyPanel}>
          <div className={styles.compass} aria-hidden="true"><span>N</span></div>
          <p className={styles.emptyEyebrow}>No routes pinned</p>
          <h2>Your next campus trail is being mapped</h2>
          <p>No trails published yet. Check back for your next adventure.</p>
        </section>
      ) : null}

      <div className={styles.trailList}>
        {trails.map((trail) => {
          const completed = trail.next_event_id === null;
          return (
            <details key={trail.id} name="campus-trails" className={styles.trailFolio}>
              <summary className={styles.trailSummary}>
                <span className={styles.trailIndex} aria-hidden="true">{completed ? "✓" : String(trail.stops.length).padStart(2, "0")}</span>
                <span className={styles.summaryCopy}>
                  <strong>{trail.title}</strong>
                  <span className={completed ? styles.completedLabel : styles.progressLabel}>
                    {completed ? "Trail completed" : `${trail.completed_stops} of ${trail.stops.length} stops completed`}
                  </span>
                </span>
                <span className={styles.folioToggle} aria-hidden="true" />
              </summary>

              <div className={styles.folioBody}>
                {trail.description ? <p className={styles.description}>{trail.description}</p> : null}
                <div className={styles.progressPlate}>
                  <div className={styles.progressHeading}><span>Route progress</span><strong>{trail.completed_stops}/{trail.stops.length}</strong></div>
                  <progress aria-label={`${trail.title} completed stops`} value={trail.completed_stops} max={trail.stops.length || 1} className={styles.progress} />
                </div>

                <ol className={styles.stopList}>
                  {trail.stops.map((stop) => {
                    const isNext = stop.event_id === trail.next_event_id;
                    const stateClass = stop.completed ? styles.stopCompleted : isNext ? styles.stopNext : styles.stopWaiting;
                    return (
                      <li key={stop.event_id} className={`${styles.stop} ${stateClass}`} aria-current={isNext ? "step" : undefined}>
                        <span className={styles.stopMarker} aria-hidden="true">{stop.completed ? "✓" : stop.position}</span>
                        <div className={styles.stopCard}>
                          <p className={styles.stopMeta}>Stop {stop.position} of {trail.stops.length}{isNext ? <span>Next stop</span> : null}</p>
                          <h3>{stop.completed ? "✓ " : ""}{stop.event_title ?? "Stop unavailable"}</h3>
                          <p className={styles.stopStatus}>
                            {stop.completed ? "Completed" : !stop.available ? "This event is unavailable. Check back or contact an admin." : !stop.active ? "This stop is not active right now. You can view its details or explore another quest." : stop.total_questions === 0 ? "Questions are coming soon." : `${stop.completed_questions} of ${stop.total_questions} questions completed`}
                          </p>
                          {stop.available ? (
                            <Link className={styles.questLink} href={`/dashboard/events#quest-${stop.event_id}`}>
                              {isNext ? "Visit next stop" : "View quest"}<ForwardArrowIcon />
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
