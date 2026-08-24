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
  points: number;
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
  points: number;
  openToEveryone: boolean;
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
  points: number;
  tag: string;
  earnedAt: string;
};

export const ADMIN_CHALLENGE_STORAGE_KEY = "wits-admin-challenges";
export const ADMIN_CHALLENGE_UPDATED_EVENT = "wits-admin-challenges-updated";
export const COLLECTED_CARDS_STORAGE_KEY = "wits-collected-cards";
export const COLLECTED_CARDS_UPDATED_EVENT = "wits-collected-cards-updated";

export function getCardTierByPoints(points: number): CardRarity {
  if (points >= 60) return "Gold";
  if (points >= 30) return "Black";
  return "Blue";
}

export function getCardThemeByRarity(rarity: CardRarity) {
  switch (rarity) {
    case "Gold":
      return { accent: "#C9A24B", badge: "Gold", strength: "Hard" };
    case "Black":
      return { accent: "#111827", badge: "Black", strength: "Medium" };
    default:
      return { accent: "#2563eb", badge: "Blue", strength: "Easy" };
  }
}

export function getLocationCoordinates(location: string) {
  const normalized = location.trim().toLowerCase();

  const coordMap: Record<string, { latitude: number; longitude: number; radius_meters: number }> = {
    "great hall": { latitude: -26.1924, longitude: 28.0308, radius_meters: 40 },
    "the great hall": { latitude: -26.1924, longitude: 28.0308, radius_meters: 40 },
    "origins centre": { latitude: -26.1907, longitude: 28.0302, radius_meters: 50 },
    "old main building": { latitude: -26.192, longitude: 28.0321, radius_meters: 45 },
    "wits art museum": { latitude: -26.1889, longitude: 28.0317, radius_meters: 35 },
    "solomon mahlangu house": { latitude: -26.1901, longitude: 28.0328, radius_meters: 40 },
    "chamber of mines": { latitude: -26.1912, longitude: 28.0289, radius_meters: 35 },
    "barnato hall": { latitude: -26.1917, longitude: 28.0331, radius_meters: 40 },
    "muller hall": { latitude: -26.1913, longitude: 28.0348, radius_meters: 35 },
    "library law building": { latitude: -26.1923, longitude: 28.034, radius_meters: 45 },
    "braamfontein campus": { latitude: -26.1919, longitude: 28.0299, radius_meters: 60 },
    "wits health sciences building": { latitude: -26.196, longitude: 28.0347, radius_meters: 60 },
    "wits science stadium": { latitude: -26.1967, longitude: 28.0382, radius_meters: 55 },
    "university corner": { latitude: -26.1905, longitude: 28.0286, radius_meters: 35 },
    "m1 main gate": { latitude: -26.1888, longitude: 28.0278, radius_meters: 30 },
    "the matrix": { latitude: -26.1929, longitude: 28.032, radius_meters: 30 },
    "wits theatre": { latitude: -26.1915, longitude: 28.0362, radius_meters: 35 },
    "wits student union": { latitude: -26.1934, longitude: 28.0332, radius_meters: 40 },
    "wits business school": { latitude: -26.1944, longitude: 28.0382, radius_meters: 45 },
    "school of governance": { latitude: -26.1947, longitude: 28.0367, radius_meters: 45 },
    "education campus": { latitude: -26.1969, longitude: 28.0349, radius_meters: 50 },
  };

  return coordMap[normalized] ?? { latitude: -26.1929, longitude: 28.0305, radius_meters: 50 };
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
