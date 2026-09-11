import { apiRequest } from "./api";
import {
  getUnsyncedAttempts,
  markAttemptSynced,
  deleteAttempt,
  OfflineAttempt,
} from "./offlineDb";

export type SyncResult = {
  attempt: OfflineAttempt;
  success: boolean;
  message?: string;
};

/**
 * Sends every queued offline attempt to the backend, in the order they
 * were made. Each attempt includes the original attemptedAt timestamp
 * and the location recorded at the time, so the backend can validate
 * it as though it happened then rather than now.
 *
 * Successful attempts are removed from the local queue. Failed ones
 * are left in place (still marked unsynced) so a later sync can retry
 * them — e.g. if the failure was a transient network issue.
 */
export async function syncOfflineAttempts(): Promise<SyncResult[]> {
  const pending = await getUnsyncedAttempts();
  if (pending.length === 0) return [];

  // Sort oldest-first, so attempts are validated in the order they
  // actually happened.
  pending.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));

  const results: SyncResult[] = [];

  for (const attempt of pending) {
    const { error } = await apiRequest(
      `/events/${encodeURIComponent(attempt.eventId)}/submit-answer`,
      "POST",
      {
        challengeId: attempt.challengeId,
        answer: attempt.answer,
        attemptedAt: attempt.attemptedAt,
        latitude: attempt.latitude,
        longitude: attempt.longitude,
      }
    );

    if (error) {
      results.push({ attempt, success: false, message: error.message });
      continue;
    }

    await markAttemptSynced(attempt.id);
    await deleteAttempt(attempt.id); // clean up now that it's confirmed on the server
    results.push({ attempt, success: true });
  }

  return results;
}
