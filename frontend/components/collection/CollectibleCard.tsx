import type { CardRecord } from "@/lib/api";
import type { MouseEventHandler } from "react";
import CardEmblem from "./CardEmblem";
import styles from "./album.module.css";

export default function CollectibleCard({ card, questTitle = "", selected = false, disabled = false, onClick, inspect = false }: {
  card: CardRecord; questTitle?: string; selected?: boolean; disabled?: boolean; onClick?: MouseEventHandler<HTMLButtonElement>; inspect?: boolean;
}) {
  const className = `${styles.card} ${card.rarity === "Gold" ? styles.gold : card.rarity === "Black" ? styles.black : ""} ${onClick ? styles.interactive : ""} ${selected ? styles.selected : ""}`;
  const cardBackground = card.rarity === "Gold" ? "url('/art/gold-crystal.jpg')" : card.rarity === "Black" ? "url('/art/black-crystal.jpg')" : "url('/art/blue-crystal.jpg')";
  const content = <div className={styles.cardInner}>
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em]">
      <span className={styles.cardEyebrow}>{card.rarity}</span><span className={styles.cardEyebrow}>{selected ? "Selected" : "Wits Quest"}</span>
    </div>
    <CardEmblem title={card.title} category={card.tag} questTitle={questTitle} />
    <div className="p-4">
      <p className={styles.cardTag}>{card.tag || "General"}</p>
      <h3 className={styles.cardTitle}>{card.title}</h3>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-3">
        <span className={styles.cardMeta}>{inspect ? "Tap to inspect" : card.strength || card.rarity}</span>
        <span className="text-right"><strong className={styles.cardValue}>{card.points}</strong><span className={styles.cardPointsLabel}>Battle points</span></span>
      </div>
    </div>
  </div>;
  return onClick ? (
    <button
      type="button"
      className={className}
      style={{
        backgroundImage: cardBackground,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
      disabled={disabled}
      onClick={onClick}
      aria-label={inspect ? `Inspect ${card.title}` : undefined}
      aria-pressed={inspect ? undefined : selected}
    >
      {content}
    </button>
  ) : (
    <article
      className={className}
      style={{
        backgroundImage: cardBackground,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      {content}
    </article>
  );
}
