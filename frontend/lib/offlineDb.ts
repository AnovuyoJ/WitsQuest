import { openDB, DBSchema, IDBPDatabase } from "idb";

type Event = {
  id: string; title: string; description: string | null; latitude: number; longitude: number;
  radius_meters: number; starts_at: string; ends_at: string;
};

export type CachedChallenge = {
  id: string;
  event_id: string;
  question_text: string;
  question_type: "multiple_choice" | "text" | "true_false";
  options: string[] | null;
  card_id: string | null;
  offline_token: string;
  offline_expires_at: string;
  ownerId: string;
  ownerEvent: string;
};

export type OfflineAttempt = {
  id: string;
  ownerId: string;
  ownerChallenge: string;
  eventId: string;
  challengeId: string;
  answer: string;
  attemptedAt: string;
  offlineToken: string;
  synced: boolean;
};

interface WitsQuestDB extends DBSchema {
  events: { key: string; value: Event };
  challenges: { key: string; value: CachedChallenge; indexes: { "by-owner": string } };
  attempts: {
    key: string;
    value: OfflineAttempt;
    indexes: { "by-owner": string; "by-owner-challenge": string };
  };
}

let dbPromise: Promise<IDBPDatabase<WitsQuestDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<WitsQuestDB>("witsquest-offline", 3, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains("events")) db.createObjectStore("events", { keyPath: "id" });
        if (oldVersion < 3 && db.objectStoreNames.contains("challenges")) db.deleteObjectStore("challenges");
        if (!db.objectStoreNames.contains("challenges")) {
          const challenges = db.createObjectStore("challenges", { keyPath: "ownerEvent" });
          challenges.createIndex("by-owner", "ownerId");
        }
        if (!db.objectStoreNames.contains("attempts")) {
          const attempts = db.createObjectStore("attempts", { keyPath: "id" });
          attempts.createIndex("by-owner", "ownerId");
          attempts.createIndex("by-owner-challenge", "ownerChallenge", { unique: true });
        } else if (oldVersion < 3) {
          const attempts = transaction.objectStore("attempts");
          attempts.createIndex("by-owner", "ownerId");
          attempts.createIndex("by-owner-challenge", "ownerChallenge", { unique: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheEvents(events: Event[]) {
  const db = await getDb();
  const tx = db.transaction("events", "readwrite");
  await Promise.all(events.map((event) => tx.store.put(event)));
  await tx.done;
}

export async function getCachedEvents(): Promise<Event[]> {
  return (await getDb()).getAll("events");
}

export async function cacheChallenge(ownerId: string, challenge: Omit<CachedChallenge, "ownerId" | "ownerEvent">) {
  const db = await getDb();
  await db.put("challenges", { ...challenge, ownerId, ownerEvent: `${ownerId}:${challenge.event_id}` });
}

export async function getCachedChallenge(ownerId: string, eventId: string): Promise<CachedChallenge | undefined> {
  return (await getDb()).get("challenges", `${ownerId}:${eventId}`);
}

export async function queueOfflineAttempt(attempt: Omit<OfflineAttempt, "synced" | "ownerChallenge">) {
  const db = await getDb();
  const ownerChallenge = `${attempt.ownerId}:${attempt.challengeId}`;
  const existing = await db.getFromIndex("attempts", "by-owner-challenge", ownerChallenge);
  if (existing && !existing.synced) return existing;
  const queued = { ...attempt, ownerChallenge, synced: false };
  await db.put("attempts", queued);
  return queued;
}

export async function getUnsyncedAttempts(ownerId: string): Promise<OfflineAttempt[]> {
  const attempts = await (await getDb()).getAllFromIndex("attempts", "by-owner", ownerId);
  return attempts.filter((attempt) => !attempt.synced);
}

export async function deleteAttempt(id: string) {
  await (await getDb()).delete("attempts", id);
}

export async function clearOfflineDataForOwner(ownerId: string) {
  const db = await getDb();
  const tx = db.transaction(["attempts", "challenges"], "readwrite");
  const attempts = await tx.objectStore("attempts").index("by-owner").getAllKeys(ownerId);
  const challenges = await tx.objectStore("challenges").index("by-owner").getAllKeys(ownerId);
  await Promise.all([
    ...attempts.map((key) => tx.objectStore("attempts").delete(key)),
    ...challenges.map((key) => tx.objectStore("challenges").delete(key)),
  ]);
  await tx.done;
}
