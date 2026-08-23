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