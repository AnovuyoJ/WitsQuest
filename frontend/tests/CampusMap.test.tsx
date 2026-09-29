/// <reference types="jest" />

import { render, screen, waitFor } from "@testing-library/react";
import CampusMap from "../components/CampusMap";

import { apiRequest, getZones } from "../lib/api";
import { cacheEvents, getCachedEvents } from "../lib/offlineDb";

jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({})),
}));

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Circle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="event-circle">{children}</div>
  ),
  Polygon: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="polygon">{children}</div>
  ),
  useMap: () => ({
    setView: jest.fn(),
  }),
}));

jest.mock("../lib/api", () => ({
  apiRequest: jest.fn(),
  getZones: jest.fn(),
  getZone: jest.fn(),
  claimZone: jest.fn(),
}));

jest.mock("../lib/offlineDb", () => ({
  cacheEvents: jest.fn(),
  getCachedEvents: jest.fn(),
}));

jest.mock("../lib/geo", () => ({
  getDistanceMeters: jest.fn(() => 500),
}));

describe("CampusMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: jest.fn(() => 1),
        clearWatch: jest.fn(),
      },
    });

    (getZones as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    (getCachedEvents as jest.Mock).mockResolvedValue([]);

    (apiRequest as jest.Mock).mockResolvedValue({
      data: [
        {
          id: "procedural-event-1",
          title: "Campus Discovery: Great Hall",
          description:
            "Explore Great Hall and discover something interesting about the Wits campus.",
          latitude: -26.1929,
          longitude: 28.0305,
          radius_meters: 30,
          starts_at: "2026-09-28T10:00:00.000Z",
          ends_at: "2026-09-29T10:00:00.000Z",
        },
      ],
      error: null,
    });
  });

  it("renders a procedurally generated event returned by the API", async () => {
    render(<CampusMap />);

    await waitFor(() => {
      expect(
        screen.getByText("Campus Discovery: Great Hall")
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("event-circle")).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/events");
  });

  it("caches events after successfully loading them", async () => {
    render(<CampusMap />);

    await waitFor(() => {
      expect(cacheEvents).toHaveBeenCalled();
    });

    expect(cacheEvents).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "procedural-event-1",
          title: "Campus Discovery: Great Hall",
        }),
      ])
    );
  });
});

