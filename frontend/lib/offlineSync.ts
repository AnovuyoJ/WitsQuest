import { apiRequest, type ApiError } from "./api";
import { deleteAttempt, getUnsyncedAttempts, type OfflineAttempt } from "./offlineDb";
import { supabase } from "./supabaseClient";

export type SyncResult = {
  attempt: OfflineAttempt;
  status: "accepted" | "rejected" | "retry";
  message: string;
};

let syncInFlight: Promise<SyncResult[]> | null = null;
const permanentStatuses = new Set([400, 403, 404, 409, 410, 422]);

function rejectionMessage(error: ApiError) {
  return error.message || "This offline answer could not be accepted.";
}

async function runSync(): Promise<SyncResult[]> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return [];
  const ownerId = data.session.user.id;
  const pending = await getUnsyncedAttempts(ownerId);
  pending.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
  const results: SyncResult[] = [];

  for (const attempt of pending) {
    const response = await apiRequest(
      `/events/${encodeURIComponent(attempt.eventId)}/submit-answer`,
      "POST",
      {
        challengeId: attempt.challengeId,
        answer: attempt.answer,
        attemptedAt: attempt.attemptedAt,
        offlineToken: attempt.offlineToken,
        clientAttemptId: attempt.id,
      },
    );

    if (!response.error) {
      await deleteAttempt(attempt.id);
      results.push({ attempt, status: "accepted", message: "Your offline answer was checked and recorded." });
    } else if (response.error.status && permanentStatuses.has(response.error.status)) {
      await deleteAttempt(attempt.id);
      results.push({ attempt, status: "rejected", message: rejectionMessage(response.error) });
    } else {
      results.push({ attempt, status: "retry", message: "Sync was interrupted. The answer remains safely queued." });
    }
  }
  return results;
}

export function syncOfflineAttempts(): Promise<SyncResult[]> {
  if (!syncInFlight) syncInFlight = runSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
}
