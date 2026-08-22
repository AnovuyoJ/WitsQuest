"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type VerificationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "verifying" }
  | { status: "verified"; distanceMeters: number }
  | { status: "too-far"; distanceMeters: number }
  | { status: "event-inactive" }
  | { status: "error"; message: string };

export function useLocationVerification(eventId: string) {
  const [state, setState] = useState<VerificationState>({ status: "idle" });

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

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setState({ status: "error", message: "You need to be signed in to verify location." });
          return;
        }

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/verify-location`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
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

  return { state, verify };
}