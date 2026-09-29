import { database } from "./database";
import { CampusLandmark } from "./landmarkService";
import { getCampusLandmarks } from "./landmarkService";
import { haversineDistanceMeters } from "./locationService";

const MIN_EVENT_DISTANCE_METERS = 150;
const DEFAULT_EVENT_RADIUS_METERS = 30;
const DEFAULT_EVENT_DURATION_HOURS = 24;

export type ProceduralEventResult = {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  starts_at: string;
  ends_at: string;
  is_procedural: boolean;
};

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
  
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
  
      const current = copy[i];
      const random = copy[j];
  
      if (current === undefined || random === undefined) {
        continue;
      }
  
      copy[i] = random;
      copy[j] = current;
    }
  
    return copy;
  }

export function selectSpacedLandmarks(
  landmarks: CampusLandmark[],
  count: number
): CampusLandmark[] {
  const selected: CampusLandmark[] = [];

  for (const landmark of shuffle(landmarks)) {
    const tooClose = selected.some(
      (chosen) =>
        haversineDistanceMeters(
          chosen.latitude,
          chosen.longitude,
          landmark.latitude,
          landmark.longitude
        ) < MIN_EVENT_DISTANCE_METERS
    );

    if (tooClose) {
      continue;
    }

    selected.push(landmark);

    if (selected.length >= count) {
      break;
    }
  }

  return selected;
}

async function createProceduralEvent(
    landmark: CampusLandmark,
    startsAt: Date,
    endsAt: Date
  ): Promise<ProceduralEventResult> {
    const { rows } = await database.query<ProceduralEventResult>(
      `WITH inserted AS (
         INSERT INTO public.events
           (
             title,
             description,
             latitude,
             longitude,
             radius_meters,
             starts_at,
             ends_at,
             campaign_id,
             access_code,
             is_procedural
           )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, true)
         RETURNING *
       ),
       published AS (
         UPDATE public.events e
         SET
           published_snapshot = to_jsonb(i) - 'published_snapshot',
           published_revision = i.draft_revision,
           published_at = now()
         FROM inserted i
         WHERE e.id = i.id
         RETURNING e.*
       )
       SELECT
         id,
         title,
         description,
         latitude,
         longitude,
         radius_meters,
         starts_at,
         ends_at,
         is_procedural
       FROM published`,
      [
        `Campus Discovery: ${landmark.name}`,
        `Explore ${landmark.name} and discover something interesting about the Wits campus.`,
        landmark.latitude,
        landmark.longitude,
        DEFAULT_EVENT_RADIUS_METERS,
        startsAt,
        endsAt,
      ]
    );
  
    const createdEvent = rows[0];
  
    if (!createdEvent) {
      throw new Error("Failed to create procedural event.");
    }
  
    return createdEvent;
  }

  export async function generateProceduralEvents(
    count: number
  ): Promise<ProceduralEventResult[]> {
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      throw new Error("Event count must be an integer between 1 and 100.");
    }
  
    const landmarks = await getCampusLandmarks();
  
    const selectedLandmarks = selectSpacedLandmarks(landmarks, count);
  
    if (selectedLandmarks.length < count) {
      throw new Error(
        `Could only find ${selectedLandmarks.length} sufficiently spaced campus locations for ${count} events.`
      );
    }
  
    const startsAt = new Date();
    const endsAt = new Date(
      startsAt.getTime() +
        DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000
    );
  
    const createdEvents: ProceduralEventResult[] = [];
  
    for (const landmark of selectedLandmarks) {
      const createdEvent = await createProceduralEvent(
        landmark,
        startsAt,
        endsAt
      );
  
      createdEvents.push(createdEvent);
    }
  
    return createdEvents;
  }

  export async function rotateProceduralEvents(): Promise<
  ProceduralEventResult[]
> {
  const { rows: expiredEvents } = await database.query<{
    id: string;
    latitude: number;
    longitude: number;
  }>(
    `SELECT id, latitude, longitude
     FROM public.events
     WHERE is_procedural = true
       AND retired_at IS NULL
       AND ends_at < now()`
  );

  if (expiredEvents.length === 0) {
    return [];
  }

  const { rows: activeEvents } = await database.query<{
    latitude: number;
    longitude: number;
  }>(
    `SELECT latitude, longitude
     FROM public.events
     WHERE is_procedural = true
       AND retired_at IS NULL
       AND starts_at <= now()
       AND ends_at >= now()`
  );

  const landmarks = await getCampusLandmarks();

  const availableLandmarks = landmarks.filter((landmark) => {
    return !activeEvents.some(
      (event) =>
        haversineDistanceMeters(
          event.latitude,
          event.longitude,
          landmark.latitude,
          landmark.longitude
        ) < MIN_EVENT_DISTANCE_METERS
    );
  });

  const selectedLandmarks = selectSpacedLandmarks(
    availableLandmarks,
    expiredEvents.length
  );

  if (selectedLandmarks.length < expiredEvents.length) {
    throw new Error(
      `Could only find ${selectedLandmarks.length} sufficiently spaced campus locations for ${expiredEvents.length} replacement events.`
    );
  }

  await database.query(
    `UPDATE public.events
     SET retired_at = now()
     WHERE is_procedural = true
       AND retired_at IS NULL
       AND ends_at < now()`
  );

  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() +
      DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000
  );

  const replacementEvents: ProceduralEventResult[] = [];

  for (const landmark of selectedLandmarks) {
    const createdEvent = await createProceduralEvent(
      landmark,
      startsAt,
      endsAt
    );

    replacementEvents.push(createdEvent);
  }

  return replacementEvents;
}