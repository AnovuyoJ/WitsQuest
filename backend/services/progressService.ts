export type ProgressStats = {
  points: number;
  correctAnswers: number;
  attempts: number;
  cardsOwned: number;
  battlesCompleted: number;
  battlesWon: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

const DAY_MS = 86_400_000;

function utcDay(value: string | Date): number {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateCurrentStreak(
  activityDates: Array<string | Date>,
  now = new Date(),
): number {
  const days = [...new Set(activityDates.map(utcDay))].sort((a, b) => b - a);
  const latestDay = days[0];
  if (latestDay === undefined) return 0;

  const today = utcDay(now);
  const latestAge = Math.round((today - latestDay) / DAY_MS);
  if (latestAge > 1 || latestAge < 0) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previousDay = days[index - 1];
    const currentDay = days[index];
    if (previousDay === undefined || currentDay === undefined || previousDay - currentDay !== DAY_MS) break;
    streak += 1;
  }
  return streak;
}

export function buildAchievements(
  stats: ProgressStats,
  currentStreak: number,
): Achievement[] {
  return [
    { id: "first-step", title: "First Step", description: "Answer your first challenge correctly.", earned: stats.correctAnswers >= 1 },
    { id: "campus-scholar", title: "Campus Scholar", description: "Complete five challenges correctly.", earned: stats.correctAnswers >= 5 },
    { id: "card-collector", title: "Card Collector", description: "Build a collection of five cards.", earned: stats.cardsOwned >= 5 },
    { id: "battle-tested", title: "Battle Tested", description: "Complete your first card battle.", earned: stats.battlesCompleted >= 1 },
    { id: "champion", title: "Quest Champion", description: "Win your first card battle.", earned: stats.battlesWon >= 1 },
    { id: "on-a-roll", title: "On a Roll", description: "Complete challenges on three consecutive days.", earned: currentStreak >= 3 },
  ];
}
