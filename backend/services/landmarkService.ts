import { HttpError, number } from "./validation";
import { haversineDistanceMeters } from "./locationService";

type Landmark = { name: string; osmUrl: string };
type Element = { type: string; id: number; tags?: { name?: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } };
const cache = new Map<string, { expires: number; value: Landmark | null }>();

export async function lookupLandmark(latitude: unknown, longitude: unknown): Promise<Landmark | null> {
  const lat = number(latitude, "Latitude", -90, 90);
  const lon = number(longitude, "Longitude", -180, 180);
  const key = `${lat},${lon}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  // Fixed query, validated numbers, bounded radius: callers cannot submit arbitrary QL.
  const query = `[out:json][timeout:15];
    is_in(${lat},${lon})->.containing;
    area.containing[amenity~"^(university|college)$"]->.campus;
    (nwr(area.campus)(around:150,${lat},${lon})[building][building!="no"][name];
     nwr(area.campus)(around:150,${lat},${lon})[historic][name];
     nwr(area.campus)(around:150,${lat},${lon})[tourism~"^(artwork|museum)$"][name];);
    out center;`;
  let elements: Element[];
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "WitsQuest/1.0 (campus event location verification)" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("Overpass unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload.elements) || payload.remark) throw new Error("Incomplete Overpass response");
    elements = payload.elements;
  } catch {
    throw new HttpError(503, "Campus landmark lookup is temporarily unavailable. Please try again before saving.");
  }
  const candidates = elements.filter(element => element &&
    ["node", "way", "relation"].includes(element.type) && Number.isSafeInteger(element.id) &&
    typeof element.tags?.name === "string" && element.tags.name.trim() &&
    Number.isFinite(element.lat ?? element.center?.lat) && Number.isFinite(element.lon ?? element.center?.lon));
  const distance = (element: Element) => haversineDistanceMeters(lat, lon, (element.lat ?? element.center?.lat)!, (element.lon ?? element.center?.lon)!);
  candidates.sort((a, b) => distance(a) - distance(b));
  const closest = candidates[0];
  const value = closest ? { name: closest.tags!.name!.trim(), osmUrl: `https://www.openstreetmap.org/${closest.type}/${closest.id}` } : null;
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 5 * 60 * 1000, value });
  return value;
}

export async function requireLandmark(latitude: unknown, longitude: unknown) {
  const landmark = await lookupLandmark(latitude, longitude);
  if (!landmark) throw new HttpError(422, "No named campus building or landmark was found within 150 metres in OpenStreetMap. Check the coordinates; map coverage may be incomplete.");
  return landmark;
}
