import {
  haversineDistanceMeters,
  verifyPlayerLocation,
} from "../services/locationService";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const EARTH_RADIUS_METERS = 6_371_000;

function longitudeOffsetForMeters(distanceMeters: number): number {
  return (distanceMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
}

function createEvent(radiusMeters: number) {
  return {
    latitude: 0,
    longitude: 0,
    radius_meters: radiusMeters,
    starts_at: "2000-01-01T00:00:00.000Z",
    ends_at: "2100-01-01T00:00:00.000Z",
  };
}

describe("haversineDistanceMeters", () => {
  it("calculates the known distance between two coordinates", () => {
    const distance = haversineDistanceMeters(0, 0, 0, 1);

    // One degree of longitude at the equator is approximately 111.195 km.
    expect(distance).toBeCloseTo(111_194.93, 2);
  });
});

describe("verifyPlayerLocation - radius check", () => {
  it("allows a player exactly at the event radius boundary", () => {
    const event = createEvent(100);
    const playerLongitude = longitudeOffsetForMeters(100);

    const result = verifyPlayerLocation(0, playerLongitude, event);

    expect(result.distanceMeters).toBeCloseTo(100, 2);
    expect(result.withinRange).toBe(true);
  });

  it("rejects a player clearly outside the event radius", () => {
    const event = createEvent(100);
    const playerLongitude = longitudeOffsetForMeters(150);

    const result = verifyPlayerLocation(0, playerLongitude, event);

    expect(result.distanceMeters).toBeCloseTo(150, 2);
    expect(result.withinRange).toBe(false);
  });
});

describe("verifyPlayerLocation - event activity window", () => {
  const timedEvent = {
    latitude: 0,
    longitude: 0,
    radius_meters: 100,
    starts_at: "2026-01-10T10:00:00.000Z",
    ends_at: "2026-01-10T12:00:00.000Z",
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks an event as inactive before its start time", () => {
    jest.setSystemTime(new Date("2026-01-10T09:00:00.000Z"));

    const result = verifyPlayerLocation(0, 0, timedEvent);

    expect(result.eventActive).toBe(false);
  });

  it("marks an event as active exactly at its start time", () => {
    jest.setSystemTime(new Date("2026-01-10T10:00:00.000Z"));

    const result = verifyPlayerLocation(0, 0, timedEvent);

    expect(result.eventActive).toBe(true);
  });

  it("marks an event as active between its start and end times", () => {
    jest.setSystemTime(new Date("2026-01-10T11:00:00.000Z"));

    const result = verifyPlayerLocation(0, 0, timedEvent);

    expect(result.eventActive).toBe(true);
  });

  it("marks an event as active exactly at its end time", () => {
    jest.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));

    const result = verifyPlayerLocation(0, 0, timedEvent);

    expect(result.eventActive).toBe(true);
  });

  it("marks an event as inactive after its end time", () => {
    jest.setSystemTime(new Date("2026-01-10T13:00:00.000Z"));

    const result = verifyPlayerLocation(0, 0, timedEvent);

    expect(result.eventActive).toBe(false);
  });
});
