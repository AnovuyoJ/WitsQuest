import { openDB, DBSchema, IDBPDatabase } from 'idb';

type Event = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  starts_at: string;
  ends_at: string;
};

type Challenge = {
  id: string;
  event_id: string;
  question_text: string;
  question_type: "multiple_choice" | "text" | "true_false";
  options: string[] | null;
  card_id: string | null;
};

export type OfflineAttempt = {
  id: string; // locally generated, e.g. crypto.randomUUID()
  eventId: string;
  challengeId: string;
  answer: string;
  attemptedAt: string; // ISO timestamp, recorded the moment the player answered
  latitude: number | null;
  longitude: number | null;
  synced: boolean;
};

interface WitsQuestDB extends DBSchema {
  events: {
    key: string; // event id
    value: Event;
  };
  challenges: {
    key: string; // event id (one active challenge cached per event)
    value: Challenge;
  };
  attempts: {
    key: string; // local attempt id
    value: OfflineAttempt;
  };
}

let dbPromise: Promise<IDBPDatabase<WitsQuestDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<WitsQuestDB>('witsquest-offline', 1, {
      upgrade(db) {
        db.createObjectStore('events', { keyPath: 'id' });
        db.createObjectStore('challenges', { keyPath: 'event_id' });
        db.createObjectStore('attempts', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

// ----- Events -----

export async function cacheEvents(events: Event[]) {
  const db = await getDb();
  const tx = db.transaction('events', 'readwrite');
  await Promise.all(events.map((event) => tx.store.put(event)));
  await tx.done;
}

export async function getCachedEvents(): Promise<Event[]> {
  const db = await getDb();
  return db.getAll('events');
}

// ----- Challenges -----

export async function cacheChallenge(challenge: Challenge) {
  const db = await getDb();
  await db.put('challenges', challenge);
}

export async function getCachedChallenge(eventId: string): Promise<Challenge | undefined> {
  const db = await getDb();
  return db.get('challenges', eventId);
}

// ----- Offline attempt queue -----

export async function queueOfflineAttempt(attempt: Omit<OfflineAttempt, 'synced'>) {
  const db = await getDb();
  await db.put('attempts', { ...attempt, synced: false });
}

export async function getUnsyncedAttempts(): Promise<OfflineAttempt[]> {
  const db = await getDb();
  const all = await db.getAll('attempts');
  return all.filter((a) => !a.synced);
}

export async function markAttemptSynced(id: string) {
  const db = await getDb();
  const attempt = await db.get('attempts', id);
  if (attempt) {
    attempt.synced = true;
    await db.put('attempts', attempt);
  }
}

export async function deleteAttempt(id: string) {
  const db = await getDb();
  await db.delete('attempts', id);
}
