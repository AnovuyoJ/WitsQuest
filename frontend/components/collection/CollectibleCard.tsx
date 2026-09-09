import type { CardRecord } from "@/lib/api";
import type { MouseEventHandler } from "react";
import CardEmblem from "./CardEmblem";
import styles from "./album.module.css";

export default function CollectibleCard({ card, questTitle = "", selected = false, disabled = false, onClick, inspect = false }: {
  card: CardRecord; questTitle?: string; selected?: boolean; disabled?: boolean; onClick?: MouseEventHandler<HTMLButtonElement>; inspect?: boolean;
}) {
  const className = `${styles.card} ${card.rarity === "Gold" ? styles.gold : card.rarity === "Black" ? styles.black : ""} ${onClick ? styles.interactive : ""} ${selected ? styles.selected : ""}`;
  const content = <div className={styles.cardInner}>
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em]">
      <span>{card.rarity}</span><span>{selected ? "Selected" : "Wits Quest"}</span>
    </div>
    <CardEmblem title={card.title} category={card.tag} questTitle={questTitle} />
    <div className="p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/75">{card.tag || "General"}</p>
      <h3 className={styles.cardTitle}>{card.title}</h3>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-3">
        <span className="text-xs text-white/80">{inspect ? "Tap to inspect" : card.strength || card.rarity}</span>
        <span className="text-right"><strong className="text-3xl font-black leading-none">{card.points}</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-white/75">Battle points</span></span>
      </div>
    </div>
  </div>;
  return onClick ? <button type="button" className={className} disabled={disabled} onClick={onClick} aria-label={inspect ? `Inspect ${card.title}` : undefined} aria-pressed={inspect ? undefined : selected}>{content}</button> : <article className={className}>{content}</article>;
}
