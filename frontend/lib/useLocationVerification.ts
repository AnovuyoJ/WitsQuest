"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { API_URL } from "@/lib/api";

type VerificationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "verifying" }
  | { status: "verified"; distanceMeters: number }
  | { status: "too-far"; distanceMeters: number }
  | { status: "event-inactive" }
  | { status: "low-accuracy" }
  | { status: "verifying-code" }
  | { status: "error"; message: string };

export function useLocationVerification(eventId: string) {
  const [state, setState] = useState<VerificationState>({ status: "idle" });

  async function getSessionOrError(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState({ status: "error", message: "You need to be signed in to verify location." });
      return null;
    }
    return session.access_token;
  }

  async function verify() {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "Your device doesn't support location services." });
      return;
    }

    setState({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState({ status: "verifying" });

        const { latitude, longitude, accuracy } = position.coords;

        const token = await getSessionOrError();
        if (!token) return;

        try {
          const res = await fetch(
            `${API_URL}/api/events/${encodeURIComponent(eventId)}/verify-location`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ latitude, longitude, accuracy }),
            }
          );

          const body = await res.json();

          if (res.status === 200) {
            setState({ status: "verified", distanceMeters: body.distanceMeters });
          } else if (res.status === 403) {
            setState({ status: "too-far", distanceMeters: body.distanceMeters });
          } else if (res.status === 410) {
            setState({ status: "event-inactive" });
          } else if (res.status === 422 && body.canUseEventCode) {
            setState({ status: "low-accuracy" });
          } else {
            setState({ status: "error", message: body.message || "Verification failed." });
          }
        } catch {
          setState({ status: "error", message: "Could not reach the server. Try again." });
        }
      },
      (geoError) => {
        setState({
          status: "error",
          message:
            geoError.code === geoError.PERMISSION_DENIED
              ? "Location permission denied. Enable it in your browser settings to play."
              : "Couldn't get your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function verifyWithCode(eventCode: string) {
    setState({ status: "verifying-code" });

    const token = await getSessionOrError();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(eventId)}/verify-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventCode }),
        }
      );

      const body = await res.json();

      if (res.status === 200) {
        setState({ status: "verified", distanceMeters: body.distanceMeters });
      } else if (res.status === 410) {
        setState({ status: "event-inactive" });
      } else {
        setState({ status: "error", message: body.message || "That code didn't work." });
      }
    } catch {
      setState({ status: "error", message: "Could not reach the server. Try again." });
    }
  }

  return { state, verify, verifyWithCode };
}