export type CardRarity = "Blue" | "Black" | "Gold";

export type SavedChallengeCard = {
  id: string;
  eventId: string;
  title: string;
  rarity: CardRarity;
  description: string;
  accent: string;
  badge: string;
  strength: string;
  tag: string;
};

export type SavedChallenge = {
  id: string;
  title: string;
  location: string;
  category: string;
  description: string;
  question: string;
  answer: string;
  options: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  createdAt: string;
  published: boolean;
  card: SavedChallengeCard | null;
};

export type CollectedCard = {
  id: string;
  eventId: string;
  title: string;
  rarity: CardRarity;
  description: string;
  accent: string;
  badge: string;
  strength: string;
  tag: string;
  earnedAt: string;
};

export const ADMIN_CHALLENGE_STORAGE_KEY = "wits-admin-challenges";
export const ADMIN_CHALLENGE_UPDATED_EVENT = "wits-admin-challenges-updated";
export const COLLECTED_CARDS_STORAGE_KEY = "wits-collected-cards";
export const COLLECTED_CARDS_UPDATED_EVENT = "wits-collected-cards-updated";

export function getCardThemeByDifficulty(difficulty: SavedChallenge["difficulty"] | CardRarity) {
  switch (difficulty) {
    case "Hard":
    case "Gold":
      return { accent: "#C9A24B", badge: "Gold", strength: "Hard", rarity: "Gold" as CardRarity };
    case "Medium":
    case "Black":
      return { accent: "#111827", badge: "Black", strength: "Medium", rarity: "Black" as CardRarity };
    default:
      return { accent: "#2563eb", badge: "Blue", strength: "Easy", rarity: "Blue" as CardRarity };
  }
}

export function getLocationCoordinates(location: string) {
  const normalized = location.trim().toLowerCase();
//Need to have very specific coordinates for each location.
const coordMap: Record<string, { latitude: number; longitude: number; radius_meters: number }> = {
  "great hall": { latitude: -26.191944, longitude: 28.030278, radius_meters: 40 },
  "the great hall": { latitude: -26.191944, longitude: 28.030278, radius_meters: 40 },
  "solomon mahlangu house": { latitude: -26.192778, longitude: 28.030278, radius_meters: 40 },
  "wits theatre": { latitude: -26.192778, longitude: 28.031389, radius_meters: 35 },
  "wits art museum": { latitude: -26.192778, longitude: 28.032778, radius_meters: 35 },
  "origins centre": { latitude: -26.192778, longitude: 28.028056, radius_meters: 50 },
  "flower hall": { latitude: -26.191389, longitude: 28.025833, radius_meters: 40 },
  "fnb building": { latitude: -26.188333, longitude: 28.026111, radius_meters: 40 },
  "library law building": { latitude: -26.188333, longitude: 28.025000, radius_meters: 45 },
  "chamber of mines": { latitude: -26.191389, longitude: 28.026944, radius_meters: 35 },
  "the matrix": { latitude: -26.189444, longitude: 28.030556, radius_meters: 30 },
  "hall 29": { latitude: -26.186450, longitude: 28.026100, radius_meters: 45 },
  "wits science stadium": { latitude: -26.190662, longitude: 28.025340, radius_meters: 55 },
  "msl": { latitude: -26.190561, longitude: 28.026832, radius_meters: 40 }, // Mathematical Sciences Building
};



  return coordMap[normalized] ??{ latitude: -26.191944, longitude: 28.030278, radius_meters: 40 };
}

export function getDifficultyFromCardTheme(rarity: CardRarity): SavedChallenge["difficulty"] {
  switch (rarity) {
    case "Gold":
      return "Hard";
    case "Black":
      return "Medium";
    default:
      return "Easy";
  }
}

export function loadSavedChallenges(): SavedChallenge[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ADMIN_CHALLENGE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedChallenge[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((challenge) => ({
      ...challenge,
      published: Boolean(challenge.published),
      card: challenge.card
        ? {
            ...challenge.card,
            tag: challenge.card.tag || challenge.category || "General",
          }
        : null,
      options: Array.isArray(challenge.options) ? challenge.options : [],
    }));
  } catch {
    return [];
  }
}

export function saveSavedChallenges(challenges: SavedChallenge[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_CHALLENGE_STORAGE_KEY, JSON.stringify(challenges));
  window.dispatchEvent(new Event(ADMIN_CHALLENGE_UPDATED_EVENT));
}

export function getPublishedChallenges(): SavedChallenge[] {
  return loadSavedChallenges().filter((challenge) => challenge.published && challenge.card);
}

export function loadCollectedCards(): CollectedCard[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(COLLECTED_CARDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CollectedCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCollectedCards(cards: CollectedCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLLECTED_CARDS_STORAGE_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event(COLLECTED_CARDS_UPDATED_EVENT));
}

export function awardCollectedCardForChallenge(challenge: SavedChallenge): boolean {
  if (!challenge.card) return false;

  const existing = loadCollectedCards();
  const nextCards: CollectedCard[] = [
    {
      ...challenge.card,
      eventId: challenge.id,
      earnedAt: new Date().toISOString(),
    },
    ...existing.filter((card) => card.id !== challenge.card!.id),
  ];

  saveCollectedCards(nextCards);
  return true;
}
