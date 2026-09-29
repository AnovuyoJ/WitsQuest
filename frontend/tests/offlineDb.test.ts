import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearOfflineDataForOwner,
  getUnsyncedAttempts,
  queueOfflineAttempt,
} from "../lib/offlineDb";

const ownerOne = "offline-test-player-one";
const ownerTwo = "offline-test-player-two";

beforeEach(async () => {
  await clearOfflineDataForOwner(ownerOne);
  await clearOfflineDataForOwner(ownerTwo);
});

describe("offline attempt storage", () => {
  it("isolates queued attempts by signed-in player", async () => {
    await queueOfflineAttempt({
      id: "attempt-one",
      ownerId: ownerOne,
      eventId: "event-one",
      challengeId: "challenge-one",
      answer: "Alpha",
      attemptedAt: "2026-09-24T10:00:00.000Z",
      offlineToken: "lease-one",
    });
    await queueOfflineAttempt({
      id: "attempt-two",
      ownerId: ownerTwo,
      eventId: "event-one",
      challengeId: "challenge-one",
      answer: "Beta",
      attemptedAt: "2026-09-24T10:00:01.000Z",
      offlineToken: "lease-two",
    });

    expect(await getUnsyncedAttempts(ownerOne)).toEqual([
      expect.objectContaining({ id: "attempt-one", answer: "Alpha" }),
    ]);
    expect(await getUnsyncedAttempts(ownerTwo)).toEqual([
      expect.objectContaining({ id: "attempt-two", answer: "Beta" }),
    ]);
  });

  it("keeps only the first pending answer for a player and challenge", async () => {
    const first = await queueOfflineAttempt({
      id: "first-answer",
      ownerId: ownerOne,
      eventId: "event-one",
      challengeId: "challenge-one",
      answer: "Alpha",
      attemptedAt: "2026-09-24T10:00:00.000Z",
      offlineToken: "lease-one",
    });
    const duplicate = await queueOfflineAttempt({
      id: "changed-answer",
      ownerId: ownerOne,
      eventId: "event-one",
      challengeId: "challenge-one",
      answer: "Changed later",
      attemptedAt: "2026-09-24T10:01:00.000Z",
      offlineToken: "lease-one",
    });

    expect(duplicate.id).toBe(first.id);
    expect(await getUnsyncedAttempts(ownerOne)).toHaveLength(1);
  });
});
