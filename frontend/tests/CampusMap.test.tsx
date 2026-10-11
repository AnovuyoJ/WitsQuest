/// <reference types="jest" />

import { act, render, screen, waitFor } from "@testing-library/react";
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

  it("loads cached events offline without calling the network", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    (getCachedEvents as jest.Mock).mockResolvedValue([{ id: 'cached', title: 'Cached campus quest', latitude: -26.19, longitude: 28.03, radius_meters: 30, starts_at: '2000-01-01', ends_at: '2099-01-01' }]);
    render(<CampusMap />);
    expect(await screen.findByText('Cached campus quest')).toBeInTheDocument();
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
    expect(getZones).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it("explains when the browser cannot provide geolocation", async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    render(<CampusMap />);
    expect(await screen.findByText('Geolocation is not supported by your browser.')).toBeInTheDocument();
  });

  it.each([1, 2])('shows actionable feedback for location failure code %s', async (code) => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    (navigator.geolocation.watchPosition as jest.Mock).mockImplementation((_success, failure) => {
      failure({ code, PERMISSION_DENIED: 1 }); return 1;
    });
    const { unmount } = render(<CampusMap />);
    expect(await screen.findByText(code === 1 ? /Location permission is off/ : /We could not find your location/)).toBeInTheDocument();
    unmount(); expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(1);
    log.mockRestore();
  });

  it('reports an event loading failure when no cached events exist', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    (apiRequest as jest.Mock).mockResolvedValue({ error: { message: 'Unavailable' } });
    render(<CampusMap />);
    expect(await screen.findByText('Unable to load campus events.')).toBeInTheDocument();
    log.mockRestore();
  });
});

