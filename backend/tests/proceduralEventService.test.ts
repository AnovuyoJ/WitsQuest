/// <reference types="jest" />

import {
    generateProceduralEvents,
    rotateProceduralEvents,
    selectSpacedLandmarks,
  } from "../services/proceduralEventService";
  import type { CampusLandmark } from "../services/landmarkService";
  import { haversineDistanceMeters } from "../services/locationService";
  import { database } from "../services/database";
  import * as landmarkService from "../services/landmarkService";
  
  jest.mock("../services/database");
  
  describe("selectSpacedLandmarks", () => {
    const landmarks: CampusLandmark[] = [
      {
        name: "Landmark A",
        latitude: -26.1929,
        longitude: 28.0305,
        osmUrl: "https://example.com/a",
      },
      {
        name: "Landmark B",
        latitude: -26.1930,
        longitude: 28.0306,
        osmUrl: "https://example.com/b",
      },
      {
        name: "Landmark C",
        latitude: -26.1950,
        longitude: 28.0320,
        osmUrl: "https://example.com/c",
      },
    ];
  
    it("returns no more than the requested number of landmarks", () => {
      const selected = selectSpacedLandmarks(landmarks, 2);
  
      expect(selected.length).toBeLessThanOrEqual(2);
    });
  
    it("does not select landmarks that are too close together", () => {
      const selected = selectSpacedLandmarks(landmarks, 3);
  
      for (let i = 0; i < selected.length; i++) {
        for (let j = i + 1; j < selected.length; j++) {
          const distance = haversineDistanceMeters(
            selected[i]!.latitude,
            selected[i]!.longitude,
            selected[j]!.latitude,
            selected[j]!.longitude
          );
  
          expect(distance).toBeGreaterThanOrEqual(150);
        }
      }
    });
  
    it("can select multiple sufficiently spaced landmarks", () => {
      const selected = selectSpacedLandmarks(landmarks, 2);
  
      expect(selected.length).toBe(2);
    });
  
    it("returns fewer landmarks when there are not enough spaced locations", () => {
      const closeLandmarks: CampusLandmark[] = [
        {
          name: "Close A",
          latitude: -26.1929,
          longitude: 28.0305,
          osmUrl: "https://example.com/a",
        },
        {
          name: "Close B",
          latitude: -26.19291,
          longitude: 28.03051,
          osmUrl: "https://example.com/b",
        },
      ];
  
      const selected = selectSpacedLandmarks(closeLandmarks, 2);
  
      expect(selected.length).toBe(1);
    });
  });
  
  describe("generateProceduralEvents", () => {
    const landmarks: CampusLandmark[] = [
      {
        name: "Landmark A",
        latitude: -26.1929,
        longitude: 28.0305,
        osmUrl: "https://example.com/a",
      },
      {
        name: "Landmark B",
        latitude: -26.1950,
        longitude: 28.0320,
        osmUrl: "https://example.com/b",
      },
    ];
  
    beforeEach(() => {
      jest.restoreAllMocks();
  
      jest
        .spyOn(landmarkService, "getCampusLandmarks")
        .mockResolvedValue(landmarks);
  
      jest.spyOn(database, "query").mockImplementation(
        async () =>
          ({
            rows: [
              {
                id: "test-id",
                title: "Campus Discovery: Landmark A",
                description:
                  "Explore Landmark A and discover something interesting about the Wits campus.",
                latitude: -26.1929,
                longitude: 28.0305,
                radius_meters: 30,
                starts_at: new Date().toISOString(),
                ends_at: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
                is_procedural: true,
              },
            ],
          }) as any
      );
    });
  
    it("creates the requested number of procedural events", async () => {
      const events = await generateProceduralEvents(2);
  
      expect(events).toHaveLength(2);
      expect(database.query).toHaveBeenCalledTimes(2);
    });
  
    it("marks generated events as procedural", async () => {
      const events = await generateProceduralEvents(2);
  
      expect(events.every((event) => event.is_procedural)).toBe(true);
    });

    it("publishes generated procedural events", async () => {
      await generateProceduralEvents(1);
    
      const sql = (database.query as jest.Mock).mock.calls[0]?.[0];
    
      expect(sql).toContain("published_snapshot");
      expect(sql).toContain("published_revision");
      expect(sql).toContain("published_at");
    });
  
    it("rejects invalid event counts", async () => {
      await expect(generateProceduralEvents(0)).rejects.toThrow(
        "Event count must be an integer between 1 and 100."
      );
  
      await expect(generateProceduralEvents(101)).rejects.toThrow(
        "Event count must be an integer between 1 and 100."
      );
    });

    describe("rotateProceduralEvents", () => {
      beforeEach(() => {
        jest.clearAllMocks();
    
        jest
          .spyOn(landmarkService, "getCampusLandmarks")
          .mockResolvedValue([
            {
              name: "Fresh Landmark A",
              latitude: -26.1929,
              longitude: 28.0305,
              osmUrl: "https://example.com/a",
            },
            {
              name: "Fresh Landmark B",
              latitude: -26.1950,
              longitude: 28.0320,
              osmUrl: "https://example.com/b",
            },
          ]);
      });
    
      it("does nothing when there are no expired procedural events", async () => {
        (database.query as jest.Mock).mockResolvedValueOnce({
          rows: [],
        });
    
        const events = await rotateProceduralEvents();
    
        expect(events).toEqual([]);
        expect(landmarkService.getCampusLandmarks).not.toHaveBeenCalled();
      });
    
      it("rotates expired procedural events", async () => {
        (database.query as jest.Mock)
          .mockResolvedValueOnce({
            rows: [
              {
                id: "expired-1",
                latitude: -26.1929,
                longitude: 28.0305,
              },
            ],
          })
          .mockResolvedValueOnce({
            rows: [],
          })
          .mockResolvedValueOnce({
            rows: [],
          })
          .mockResolvedValueOnce({
            rows: [
              {
                id: "replacement-1",
                title: "Campus Discovery: Fresh Landmark A",
                description:
                  "Explore Fresh Landmark A and discover something interesting about the Wits campus.",
                latitude: -26.1929,
                longitude: 28.0305,
                radius_meters: 30,
                starts_at: new Date().toISOString(),
                ends_at: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
                is_procedural: true,
              },
            ],
          });
    
        const events = await rotateProceduralEvents();
    
        expect(events).toHaveLength(1);
        expect(events[0]?.is_procedural).toBe(true);
      });
    
      it("requires replacement locations to be sufficiently spaced", async () => {
        jest
          .spyOn(landmarkService, "getCampusLandmarks")
          .mockResolvedValue([
            {
              name: "Close Landmark A",
              latitude: -26.1929,
              longitude: 28.0305,
              osmUrl: "https://example.com/a",
            },
            {
              name: "Close Landmark B",
              latitude: -26.19291,
              longitude: 28.03051,
              osmUrl: "https://example.com/b",
            },
          ]);
      
        (database.query as jest.Mock)
          .mockResolvedValueOnce({
            rows: [
              {
                id: "expired-1",
                latitude: -26.1900,
                longitude: 28.0300,
              },
              {
                id: "expired-2",
                latitude: -26.1901,
                longitude: 28.0301,
              },
            ],
          })
          .mockResolvedValueOnce({
            rows: [],
          });
      
        await expect(rotateProceduralEvents()).rejects.toThrow(
          "Could only find"
        );
      });
    });
  });