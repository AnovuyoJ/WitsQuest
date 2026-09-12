import type { CardRecord } from "@/lib/api";
import BattleCard from "./BattleCard";
import styles from "./BattleReveal.module.css";

export default function BattleReveal({ mine, opponent, opponentName, finished, revealed = false }: {
  mine: CardRecord | null; opponent: CardRecord | null; opponentName: string; finished: boolean; revealed?: boolean;
}) {
  return <div className={styles.table}>
    <div><h3 className={styles.label}>Your card</h3>{mine ? <BattleCard card={mine} /> : <div className={styles.back}>Card locked</div>}</div>
    <div><h3 className={styles.label}>{opponentName} card</h3>
      {finished && opponent ? <div className={styles.perspective} aria-label={`${opponentName} card reveal`}>
        <div className={styles.flip}>
          <div className={styles.front} aria-hidden={!revealed}><BattleCard card={opponent} /></div>
          <div className={styles.back} aria-hidden="true"><span>WQ</span><small>WITS QUEST</small></div>
        </div>
      </div> : <div className={styles.back} aria-label="Opponent card face down"><span>WQ</span><small>WITS QUEST</small></div>}
    </div>
  </div>;
}
