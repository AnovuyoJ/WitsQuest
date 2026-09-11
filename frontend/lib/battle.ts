import type { CardRecord } from "./api";

export type BattleRound = {
  id: string; round_number: number; status: string; winner_side: number | null;
  player_one_submitted: boolean; player_two_submitted: boolean;
  player_one_card: CardRecord | null; player_two_card: CardRecord | null;
};
export type BattleState = {
  game: { id: string; status: string; is_cpu: boolean; winner_side: number | null };
  side: number; rounds: BattleRound[]; deck: (CardRecord & { used: boolean })[];
  scores: { one: number; two: number };
};
export function deckCounts(cards: Pick<CardRecord, "rarity">[]) {
  return { Gold: cards.filter(c => c.rarity === "Gold").length, Black: cards.filter(c => c.rarity === "Black").length,
    Blue: cards.filter(c => c.rarity === "Blue").length };
}
export function validDeck(cards: Pick<CardRecord, "id" | "rarity" | "points">[]) {
  const counts = deckCounts(cards);
  return cards.length === 5 && new Set(cards.map(c => c.id)).size === 5 && counts.Gold === 1 && counts.Black === 2 && counts.Blue === 2
    && cards.every(c => Number.isInteger(c.points) && c.points >= 0 && c.points <= 100);
}
