import type { CardRecord } from "@/lib/api";
import CollectibleCard from "./collection/CollectibleCard";

export default function BattleCard({ card, selected, disabled, onClick }: {
  card: CardRecord; selected?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return <CollectibleCard card={card} selected={selected} disabled={disabled} onClick={onClick} />;
}
