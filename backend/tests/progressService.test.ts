import { describe, expect, it } from "@jest/globals";
import { buildAchievements, calculateCurrentStreak } from "../services/progressService";

describe("player progress", () => {
  it("counts consecutive activity days ending today", () => {
    const streak = calculateCurrentStreak(
      ["2026-09-24T08:00:00Z", "2026-09-23T16:00:00Z", "2026-09-22T10:00:00Z"],
      new Date("2026-09-24T18:00:00Z"),
    );
    expect(streak).toBe(3);
  });

  it("keeps the streak active when the latest activity was yesterday", () => {
    const streak = calculateCurrentStreak(
      ["2026-09-23T16:00:00Z", "2026-09-22T10:00:00Z"],
      new Date("2026-09-24T18:00:00Z"),
    );
    expect(streak).toBe(2);
  });

  it("resets the streak after a missed day", () => {
    const streak = calculateCurrentStreak(
      ["2026-09-22T16:00:00Z", "2026-09-21T10:00:00Z"],
      new Date("2026-09-24T18:00:00Z"),
    );
    expect(streak).toBe(0);
  });

  it("unlocks achievements from the player's recorded progress", () => {
    const achievements = buildAchievements({
      points: 250,
      correctAnswers: 5,
      attempts: 7,
      cardsOwned: 5,
      battlesCompleted: 2,
      battlesWon: 1,
    }, 3);

    expect(achievements.every((achievement) => achievement.earned)).toBe(true);
  });
});
