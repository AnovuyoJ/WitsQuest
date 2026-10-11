import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearOfflineDataForOwner,
  cacheEvents,
  getCachedEvents,
  cacheChallenge,
  getCachedChallenge,
  deleteAttempt,
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
  it('stores campus events and refreshes an existing event by id', async () => {
    const event = { id: 'cached-event', title: 'Hall', description: null, latitude: -26.19, longitude: 28.03, radius_meters: 30, starts_at: '2026-01-01', ends_at: '2026-12-31' };
    await cacheEvents([event]);
    await cacheEvents([{ ...event, title: 'Updated Hall' }]);
    const stored = (await getCachedEvents()).filter(item => item.id === event.id);
    expect(stored).toEqual([{ ...event, title: 'Updated Hall' }]);
  });

  it('isolates cached challenges and removes only the signed-out player data', async () => {
    const challenge = { id: 'question', event_id: 'event', question_text: 'Where?', question_type: 'text' as const, options: null, card_id: null, offline_token: 'lease', offline_expires_at: '2099-01-01' };
    await cacheChallenge(ownerOne, challenge);
    await cacheChallenge(ownerTwo, { ...challenge, question_text: 'Other question' });
    expect(await getCachedChallenge(ownerOne, 'event')).toEqual(expect.objectContaining({ question_text: 'Where?', ownerId: ownerOne }));
    await clearOfflineDataForOwner(ownerOne);
    expect(await getCachedChallenge(ownerOne, 'event')).toBeUndefined();
    expect(await getCachedChallenge(ownerTwo, 'event')).toEqual(expect.objectContaining({ question_text: 'Other question' }));
  });

  it('removes a synced attempt without deleting another queued answer', async () => {
    const attempt = { ownerId: ownerOne, eventId: 'event', answer: 'Hall', attemptedAt: '2026-09-24T10:00:00Z', offlineToken: 'lease' };
    await queueOfflineAttempt({ ...attempt, id: 'remove', challengeId: 'one' });
    await queueOfflineAttempt({ ...attempt, id: 'keep', challengeId: 'two' });
    await deleteAttempt('remove');
    expect(await getUnsyncedAttempts(ownerOne)).toEqual([expect.objectContaining({ id: 'keep' })]);
  });
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
