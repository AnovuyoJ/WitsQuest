import { supabase } from "./supabaseClient";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export type ApiError = { message: string; code?: string; status?: number };
export type ApiResult<T> = { data: T | null; error: ApiError | null };

// Only fixed, handwritten Express routes are called. No table names, SQL, or query builders cross the network.
export async function apiRequest<T>(path: string, method = "GET", body?: unknown): Promise<ApiResult<T>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return { data: null, error: { message: "You must be signed in.", status: 401 } };
    const response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) return { data: null, error: { message: result.message || "Request failed.", status: response.status, code: result.code } };
    return { data: result as T, error: null };
  } catch {
    return { data: null, error: { message: "Could not reach the server. Try again." } };
  }
}

export async function getAdminAccess(): Promise<boolean> {
  const { data } = await apiRequest<{ isAdmin: boolean }>("/me");
  return data?.isAdmin === true;
}

export type EventRecord = {
  id: string; title: string; description: string | null; latitude: number; longitude: number;
  radius_meters: number; starts_at: string; ends_at: string; created_at: string | null;
};
export type CardRecord = {
  id: string; event_id: string; title: string; rarity: "Blue" | "Black" | "Gold";
  description: string | null; accent: string | null; badge: string | null; strength: string | null;
  points: number; tag: string | null; created_at: string | null;
};
export type PlayerCardRecord = {
  id: string; player_id: string; event_id: string; card_id: string; awarded_at: string | null; cards: CardRecord | null;
};
