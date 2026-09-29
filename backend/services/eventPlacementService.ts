import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

type Point = { latitude: number; longitude: number };

export async function autoGenerateCampusEvent(
  campaignId: string,
  candidateLocations: Point[]
) {
  const { data: existingEvents } = await supabase
    .from("events")
    .select("latitude, longitude")
    .is("retired_at", null);

  const MIN_DISTANCE_METERS = 100;
  let bestLocation: Point | null = null;

  for (const candidate of candidateLocations) {
    let tooClose = false;
    if (existingEvents) {
      for (const ev of existingEvents) {
        const dist = haversineDistance(
          candidate.latitude,
          candidate.longitude,
          ev.latitude,
          ev.longitude
        );
        if (dist < MIN_DISTANCE_METERS) {
          tooClose = true;
          break;
        }
      }
    }
    if (!tooClose) {
      bestLocation = candidate;
      break;
    }
  }

  if (!bestLocation) {
    throw new Error("No suitable low-density location found for auto-event placement.");
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 day active window

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title: "Auto-Generated Campus Quest",
      description: "A newly placed campus challenge location.",
      latitude: bestLocation.latitude,
      longitude: bestLocation.longitude,
      radius_meters: 25,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      campaign_id: campaignId,
      is_auto_generated: true,
      auto_placement_metadata: { candidatesEvaluated: candidateLocations.length },
    })
    .select()
    .single();

  if (error) throw error;
  return event;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}