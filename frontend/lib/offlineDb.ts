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

interface WitsQuestDB extends DBSchema {
  events: {
    key: string;
    value: Event;
  };
}

let dbPromise: Promise<IDBPDatabase<WitsQuestDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<WitsQuestDB>('witsquest-offline', 1, {
      upgrade(db) {
        db.createObjectStore('events', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

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