"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import { useEffect, useState } from "react";
import L from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import { getDistanceMeters } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

const CAMPUS_CENTER: [number, number] = [
  -26.1929,
  28.0305,
];

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

/*
 * Custom player location icon
 */
const playerIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #043673;
        border: 4px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        position: relative;
      "
    >
      <div
        style="
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #C9A24B;
          transform: translate(-50%, -50%);
        "
      ></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/*
 * Re-center map when player's location becomes available
 */
function ChangeMapCenter({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 17);
    }
  }, [position, map]);

  return null;
}

export default function CampusMap() {
  const [position, setPosition] =
    useState<[number, number] | null>(null);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [error, setError] =
    useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  /*
   * Load events from Supabase
   */
  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          description,
          latitude,
          longitude,
          radius_meters,
          starts_at,
          ends_at
          `
        )
        .order("starts_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error loading map events:",
          error
        );

        setError(
          "Unable to load campus events."
        );

        return;
      }

      setEvents((data ?? []) as Event[]);
    }

    loadEvents();
  }, []);

  /*
   * Watch player's current location
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by your browser."
      );
      setLocating(false);
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (result) => {
          console.log(
            "PLAYER LOCATION:",
            result.coords.latitude,
            result.coords.longitude
          );

          setPosition([
            result.coords.latitude,
            result.coords.longitude,
          ]);

          setError(null);
          setLocating(false);
        },

        (locationError) => {
          console.error(
            "Geolocation error:",
            locationError
          );

          setError(locationError.code === locationError.PERMISSION_DENIED
            ? "Location permission is off. Allow location access in your browser settings to see your position."
            : "We could not find your location. Check your connection and try again.");
          setLocating(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, []);

  /*
   * Check whether event is active
   */
  function isEventActive(event: Event) {
    const now = new Date();

    return (
      now >= new Date(event.starts_at) &&
      now <= new Date(event.ends_at)
    );
  }

  /*
   * Choose event circle colour
   */
  function getEventColour(event: Event) {
    if (!isEventActive(event)) {
      return "#94a3b8";
    }

    if (!position) {
      return "#043673";
    }

    const distance = getDistanceMeters(
      position[0],
      position[1],
      event.latitude,
      event.longitude
    );

    if (distance <= event.radius_meters) {
      return "#16a34a";
    }

    return "#C9A24B";
  }

  /*
   * Get text shown in popup
   */
  function getEventStatus(event: Event) {
    if (!isEventActive(event)) {
      return "Inactive";
    }

    if (!position) {
      return "Location unavailable";
    }

    const distance = getDistanceMeters(
      position[0],
      position[1],
      event.latitude,
      event.longitude
    );

    if (distance <= event.radius_meters) {
      return "You are inside this event area";
    }

    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }

    return `${(distance / 1000).toFixed(1)}km away`;
  }

  return (
    <div className="relative h-full w-full">
      {locating && (
        <div className="absolute inset-x-4 top-4 z-[1000] mx-auto max-w-sm rounded-2xl border border-[#043673]/15 bg-white/95 p-4 shadow-xl backdrop-blur" role="status">
          <div className="flex items-center gap-3"><span className="h-3 w-3 animate-pulse rounded-full bg-[#C9A24B]" /><div><p className="text-sm font-bold text-[#043673]">Finding your position</p><p className="mt-0.5 text-xs text-slate-500">Keep this screen open while GPS connects.</p></div></div>
        </div>
      )}
      {/* ERROR MESSAGE */}
      {error && (
        <div className="absolute inset-x-4 top-4 z-[1000] max-w-sm rounded-2xl border border-red-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-bold text-red-700">Location unavailable</p><p className="mt-1 text-xs leading-5 text-red-600">{error}</p>
        </div>
      )}

      <MapContainer
        center={position ?? CAMPUS_CENTER}
        zoom={17}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        {/* Re-center when player position becomes available */}
        <ChangeMapCenter position={position} />

        {/* OpenStreetMap */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* PLAYER LOCATION */}
        {position && (
          <Marker
            position={position}
            icon={playerIcon}
          >
            <Popup>
              <strong>Your location</strong>
              <br />
              You are here.
            </Popup>
          </Marker>
        )}

        {/* EVENT LOCATIONS */}
        {events.map((event) => {
          const colour =
            getEventColour(event);

          return (
            <Circle
              key={event.id}
              center={[
                event.latitude,
                event.longitude,
              ]}
              radius={event.radius_meters}
              pathOptions={{
                color: colour,
                fillColor: colour,
                fillOpacity: 0.18,
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <strong>
                    {event.title}
                  </strong>

                  {event.description && (
                    <>
                      <br />
                      <span>
                        {event.description}
                      </span>
                    </>
                  )}

                  <br />
                  <br />

                  <strong>
                    Status:
                  </strong>{" "}
                  {getEventStatus(event)}

                  <br />

                  <strong>
                    Radius:
                  </strong>{" "}
                  {event.radius_meters}m
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {/* MAP LEGEND */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-[#043673]/10 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
        <p className="mb-2 font-semibold text-[#043673]">
          Map key
        </p>

        <div className="space-y-1.5 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
            In event range
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C9A24B]" />
            Active event
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Inactive event
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-white bg-[#043673] shadow" />
            Your location
          </div>
        </div>
      </div>
    </div>
  );
}
