'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { getEventStatus } from '@/lib/geo';
import { CampusEvent } from '@/types/event';
import { getActiveEvents } from '@/lib/eventsService';

// fix default marker icon paths (Leaflet + bundlers issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

const CAMPUS_CENTER: [number, number] = [-26.1929, 28.0305]; // Wits main campus approx

const statusColor = {
  'in-range': 'green',
  'out-of-range': 'orange',
  'expired': 'gray',
};

export default function CampusMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);

  // Watch player location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);
        setError('Unable to retrieve your location. Please enable location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch events once on mount
  useEffect(() => {
    getActiveEvents().then(setEvents);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {error && <p role="alert">{error}</p>}
      <MapContainer
        center={position ?? CAMPUS_CENTER}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <Marker position={position}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {position &&
          events.map((event) => {
            const status = getEventStatus(event, position[0], position[1]);
            return (
              <Circle
                key={event.id}
                center={[event.latitude, event.longitude]}
                radius={event.radius_meters}
                pathOptions={{ color: statusColor[status] }}
              >
                <Popup>
                  <strong>{event.title}</strong>
                  <br />
                  Status: {status}
                </Popup>
              </Circle>
            );
          })}
      </MapContainer>
    </div>
  );
}