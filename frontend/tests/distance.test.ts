// Adjust this import to wherever haversineDistanceMeters lives
import { haversineDistanceMeters } from "../lib/distance";

const EARTH_RADIUS = 6371000;
const METERS_PER_DEGREE = (EARTH_RADIUS * Math.PI) / 180; // ~111,194.9 m

describe("haversineDistanceMeters", () => {
  test("returns 0 for identical points", () => {
    expect(haversineDistanceMeters(-26.1929, 28.0305, -26.1929, 28.0305)).toBe(0);
  });

  test("one degree of latitude is ~111.19 km", () => {
    const d = haversineDistanceMeters(0, 0, 1, 0);
    expect(d).toBeCloseTo(METERS_PER_DEGREE, 0);
  });

  test("one degree of longitude at the equator is ~111.19 km", () => {
    const d = haversineDistanceMeters(0, 0, 0, 1);
    expect(d).toBeCloseTo(METERS_PER_DEGREE, 0);
  });

  test("one degree of longitude shrinks with latitude (cos 60° = 0.5)", () => {
    const d = haversineDistanceMeters(60, 0, 60, 1);
    expect(d).toBeGreaterThan(METERS_PER_DEGREE * 0.49);
    expect(d).toBeLessThan(METERS_PER_DEGREE * 0.51);
  });

  test("is symmetric (A to B equals B to A)", () => {
    const ab = haversineDistanceMeters(-26.2041, 28.0473, -33.9249, 18.4241);
    const ba = haversineDistanceMeters(-33.9249, 18.4241, -26.2041, 28.0473);
    expect(ab).toBeCloseTo(ba, 6);
  });

  test("Johannesburg to Cape Town is roughly 1,260 km", () => {
    const d = haversineDistanceMeters(-26.2041, 28.0473, -33.9249, 18.4241);
    expect(d).toBeGreaterThan(1_240_000);
    expect(d).toBeLessThan(1_280_000);
  });

  test("London to Paris is roughly 344 km", () => {
    const d = haversineDistanceMeters(51.5074, -0.1278, 48.8566, 2.3522);
    expect(d).toBeGreaterThan(340_000);
    expect(d).toBeLessThan(348_000);
  });

  test("antipodal points are half the Earth's circumference apart", () => {
    const d = haversineDistanceMeters(0, 0, 0, 180);
    expect(d).toBeCloseTo(Math.PI * EARTH_RADIUS, 0);
  });

  test("pole to pole is half the circumference", () => {
    const d = haversineDistanceMeters(90, 0, -90, 0);
    expect(d).toBeCloseTo(Math.PI * EARTH_RADIUS, 0);
  });

  test("handles crossing the antimeridian the short way", () => {
    const d = haversineDistanceMeters(0, 179, 0, -179);
    expect(d).toBeCloseTo(2 * METERS_PER_DEGREE, 0);
  });

  test("longitude is irrelevant at the poles", () => {
    const d = haversineDistanceMeters(90, 0, 90, 123);
    expect(d).toBeCloseTo(0, 3);
  });

  test("short campus-scale distance (~111 m for 0.001° latitude)", () => {
    const d = haversineDistanceMeters(-26.19, 28.03, -26.189, 28.03);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});