"use client";

import {
  apiRequest,
  getZones,
  getZone,
  claimZone,
  type EventRecord,
  type ZoneRecord,
} from "@/lib/api";


import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap,
} from "react-leaflet";

import { useEffect, useState } from "react";
import L from "leaflet";
import { getDistanceMeters } from "@/lib/geo";
import { cacheEvents, getCachedEvents } from "@/lib/offlineDb";

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

  const [zones, setZones] = useState<ZoneRecord[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneRecord | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [claimingZone, setClaimingZone] = useState(false);

  const [error, setError] =
    useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  // Whether we're currently showing cached (offline) event data
  // instead of a fresh fetch from the server.
  const [isOffline, setIsOffline] = useState(false);

  /*
   * Load events: try the network first, fall back to the local
   * cache if we're offline or the request fails. On a successful
   * network fetch, refresh the cache for next time.
   */
  useEffect(() => {
    async function loadEvents() {
      if (!navigator.onLine) {
        const cached = await getCachedEvents();
        setEvents(cached);
        setIsOffline(true);
        return;
      }

      const { data, error } = await apiRequest<EventRecord[]>("/events");

      if (error) {
        console.error("Error loading map events:", error);

        const cached = await getCachedEvents();
        if (cached.length > 0) {
          setEvents(cached);
          setIsOffline(true);
        } else {
          setError("Unable to load campus events.");
        }
        return;
      }

      const fetchedEvents = (data ?? []) as Event[];
      setEvents(fetchedEvents);
      setIsOffline(false);
      cacheEvents(fetchedEvents);
    }

    loadEvents();
  }, []);

  useEffect(() => {
    async function loadZones() {
      if (!navigator.onLine) {
        return;
      }
  
      const { data, error } = await getZones();
  
      if (error) {
        console.error("Error loading zones:", error);
        return;
      }
  
      setZones(data ?? []);
    }
  
    loadZones();
  }, []);

  /*
   * Track browser online/offline state so the UI updates the
   * moment connectivity changes, not just on initial load.
   */
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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

  async function handleClaimZone() {
    if (!selectedZone || claimingZone) {
      return;
    }
  
    setClaimingZone(true);
    setZoneError(null);
  
    const { data, error } = await claimZone(selectedZone.id);
  
    if (error) {
      setZoneError(error.message);
      setClaimingZone(false);
      return;
    }
  
    if (data?.claimed || data?.alreadyClaimed) {
      const { data: updatedZone } = await getZone(selectedZone.id);
  
      if (updatedZone) {
        setSelectedZone(updatedZone);
  
        setZones((currentZones) =>
          currentZones.map((zone) =>
            zone.id === updatedZone.id
              ? updatedZone
              : zone
          )
        );
      }
    }
  
    setClaimingZone(false);
  }

  // Only show one status banner at a time: offline takes priority
  // over "locating", since knowing you're offline matters more than
  // a GPS spinner, and showing both would stack awkwardly.
  const showLocatingBanner = locating && !isOffline;
  const showOfflineBanner = isOffline;

  return (
    <div className="relative isolate z-0 h-full w-full">
      {showLocatingBanner && (
        <div className="absolute inset-x-4 top-4 z-[1000] mx-auto max-w-sm rounded-2xl border border-[#043673]/15 bg-white/95 p-4 shadow-xl backdrop-blur" role="status">
          <div className="flex items-center gap-3"><span className="h-3 w-3 animate-pulse rounded-full bg-[#C9A24B]" /><div><p className="text-sm font-bold text-[#043673]">Finding your position</p><p className="mt-0.5 text-xs text-slate-500">Keep this screen open while GPS connects.</p></div></div>
        </div>
      )}

      {showOfflineBanner && (
        <div className="absolute inset-x-4 top-4 z-[1000] mx-auto max-w-sm rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-xl backdrop-blur" role="status">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-700">You&apos;re offline</p>
              <p className="mt-0.5 text-xs text-slate-500">Showing saved events. They&apos;ll refresh once you&apos;re back online.</p>
            </div>
          </div>
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

        {/* SELECTED ZONE TERRITORY */}
      {selectedZone && selectedZone.locations.length >= 3 && (
        <Polygon
          positions={selectedZone.locations.map((location) => [
            location.latitude,
            location.longitude,
          ])}
          pathOptions={{
            color: selectedZone.claimed_by_me
              ? "#16a34a"
              : selectedZone.claimed_by
              ? "#dc2626"
              : "#043673",
            fillColor: selectedZone.claimed_by_me
              ? "#16a34a"
              : selectedZone.claimed_by
              ? "#dc2626"
              : "#043673",
            fillOpacity: 0.12,
            weight: 3,
            dashArray: selectedZone.claimed_by ? undefined : "8 6",
          }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <strong>{selectedZone.name}</strong>
              <br />
              <span>
                {selectedZone.claimed_by_me
                  ? "You control this zone."
                  : selectedZone.claimed_by
                  ? "This zone is controlled."
                  : "Zone available to claim."}
              </span>
            </div>
          </Popup>
        </Polygon>
      )}
      </MapContainer>

      {/* ZONE CONTROL */}
      <div className="absolute right-4 top-4 z-[1000] w-[min(360px,calc(100%-2rem))]">
        <div className="rounded-2xl border border-[#043673]/10 bg-white/95 shadow-xl backdrop-blur">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
                  Zone Control
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#043673]">
                  Campus territories
                </h2>
              </div>

              <span className="rounded-full bg-[#EEF2FA] px-2.5 py-1 text-xs font-semibold text-[#043673]">
                {zones.length} {zones.length === 1 ? "zone" : "zones"}
              </span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {zones.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  No zones available yet.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Check back once campus territories have been created.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={async () => {
                      setZoneError(null);

                      const { data, error } = await getZone(zone.id);

                      if (error) {
                        setZoneError(error.message);
                        return;
                      }

                      setSelectedZone(data);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedZone?.id === zone.id
                        ? "border-[#043673] bg-[#EEF2FA]"
                        : "border-slate-200 bg-white hover:border-[#043673]/30 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[#043673]">
                          {zone.name}
                        </p>

                        {zone.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {zone.description}
                          </p>
                        )}
                      </div>

                      {zone.claimed_by_me && (
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                          Yours
                        </span>
                      )}

                      {!zone.claimed_by_me && zone.claimed_by && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                          Claimed
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-500">
                          Progress
                        </span>

                        <span className="font-bold text-[#043673]">
                          {zone.completed_location_count}/
                          {zone.location_count}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#C9A24B] transition-all"
                          style={{
                            width:
                              zone.location_count === 0
                                ? "0%"
                                : `${Math.min(
                                    100,
                                    (zone.completed_location_count /
                                      zone.location_count) *
                                      100
                                  )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedZone && (
      <div className="absolute bottom-20 right-4 z-[1000] w-[min(360px,calc(100%-2rem))]">
        <div className="rounded-2xl border border-[#043673]/10 bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
                Territory
              </p>

              <h3 className="mt-1 text-lg font-bold text-[#043673]">
                {selectedZone.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedZone(null);
                setZoneError(null);
              }}
              className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close zone details"
            >
              ×
            </button>
          </div>

          {selectedZone.description && (
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {selectedZone.description}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {selectedZone.locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    location.completed
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {location.completed ? "✓" : "•"}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {location.title}
                  </p>

                  <p className="text-xs text-slate-400">
                    {location.completed
                      ? "Challenge completed"
                      : "Challenge still needed"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {zoneError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs leading-5 text-red-700">
                {zoneError}
              </p>
            </div>
          )}

          <div className="mt-4">
            {selectedZone.claimed_by_me ? (
              <div className="rounded-xl bg-green-50 p-3 text-center">
                <p className="text-sm font-bold text-green-700">
                  🏴 You control this zone
                </p>
              </div>
            ) : selectedZone.claimed_by ? (
              <div className="rounded-xl bg-red-50 p-3 text-center">
                <p className="text-sm font-bold text-red-700">
                  This zone is already controlled
                </p>
              </div>
            ) : selectedZone.eligible ? (
              <button
                type="button"
                onClick={handleClaimZone}
                disabled={claimingZone}
                className="w-full rounded-xl bg-[#043673] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#032b5c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claimingZone
                  ? "Claiming zone..."
                  : "🏴 Claim Zone"}
              </button>
            ) : (
              <div className="rounded-xl bg-[#FFF7E8] p-3 text-center">
                <p className="text-sm font-bold text-[#8A6518]">
                  Complete every location to claim
                </p>

                <p className="mt-1 text-xs leading-5 text-[#9A7A36]">
                  You have completed{" "}
                  {selectedZone.completed_location_count} of{" "}
                  {selectedZone.location_count} locations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

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
