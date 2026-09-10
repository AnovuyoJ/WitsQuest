/**
 * Calculates the distance in meters between two lat/lng points
 * using the Haversine formula.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export type LocationVerificationResult = {
  withinRange: boolean;
  distanceMeters: number;
  eventActive: boolean;
};

/**
 * Verifies whether a player's reported location falls within an event's
 * radius, and whether the event is currently active (within its time window).
 */
export function verifyPlayerLocation(
  playerLat: number,
  playerLon: number,
  event: {
    latitude: number;
    longitude: number;
    radius_meters: number;
    starts_at: string;
    ends_at: string;
  }
): LocationVerificationResult {
  const distanceMeters = haversineDistanceMeters(
    playerLat,
    playerLon,
    event.latitude,
    event.longitude
  );

  const withinRange = distanceMeters <= event.radius_meters;

  const now = new Date();
  const eventActive = now >= new Date(event.starts_at) && now <= new Date(event.ends_at);

  return { withinRange, distanceMeters, eventActive };
}

export type MovementCheckResult = {
  plausible: boolean;
  impliedSpeedMetersPerSecond: number | null;
};

const MAX_PLAUSIBLE_SPEED_MPS = 7; // faster than running

/**
 * Compares a new location claim against the player's previous verified
 * location to detect implausibly fast movement (e.g. teleporting across
 * campus). Returns plausible = true when there's no prior verification
 * to compare against.
 */
export function checkMovementPlausibility(
  previous: { latitude: number; longitude: number; verifiedAt: string | Date } | null,
  current: { latitude: number; longitude: number; verifiedAt: Date }
): MovementCheckResult {
  if (!previous) return { plausible: true, impliedSpeedMetersPerSecond: null };

  const distanceMeters = haversineDistanceMeters(
    previous.latitude,
    previous.longitude,
    current.latitude,
    current.longitude
  );

  const previousTime = new Date(previous.verifiedAt).getTime();
  const currentTime = current.verifiedAt.getTime();
  const secondsElapsed = (currentTime - previousTime) / 1000;

  // Guard against zero/negative elapsed time (e.g. duplicate or
  // out-of-order requests), which would otherwise divide toward Infinity.
  if (secondsElapsed <= 0) {
    return { plausible: false, impliedSpeedMetersPerSecond: Infinity };
  }

  const impliedSpeedMetersPerSecond = distanceMeters / secondsElapsed;

  return {
    plausible: impliedSpeedMetersPerSecond <= MAX_PLAUSIBLE_SPEED_MPS,
    impliedSpeedMetersPerSecond,
  };
}