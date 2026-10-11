import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { database, transaction } from "../services/database";
import { getPlayerTrustStatus, recordTrustEvent } from "../services/moderationService";

jest.mock("../services/database", () => ({
  database: { query: jest.fn() },
  transaction: jest.fn(),
}));

describe("Trust & Moderation Backend Operations", () => {
  let clientQuery: jest.Mock;
  const databaseQuery = database.query as unknown as jest.Mock;
  const runTransaction = transaction as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    clientQuery = jest.fn();
    runTransaction.mockImplementation((work: (client: { query: jest.Mock }) => Promise<unknown>) => work({ query: clientQuery }));
  });

  it("reads stored trust status through the backend database connection", async () => {
    databaseQuery.mockResolvedValueOnce({ rows: [{ score: 72, status: "normal" }] });
    await expect(getPlayerTrustStatus("player-1")).resolves.toMatchObject({ score: 72, status: "normal", isAllowed: true });
    expect(databaseQuery).toHaveBeenCalledWith(expect.stringContaining("public.player_trust_score"), ["player-1"]);
  });

  it("falls back to a normal trust status for players without a score row", async () => {
    databaseQuery.mockResolvedValueOnce({ rows: [] });
    await expect(getPlayerTrustStatus("player-1")).resolves.toMatchObject({ score: 100, status: "normal", isAllowed: true });
  });

  it("records trust events, applies penalties, and creates a review flag below 60", async () => {
    clientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ score: 70 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(recordTrustEvent("player-1", "location_anomaly", { source: "test" }))
      .resolves.toEqual({ score: 55, status: "watched", restrictionMinutes: 5 });
    expect(clientQuery).toHaveBeenCalledTimes(5);
    expect(clientQuery.mock.calls[0][0]).toContain("INSERT INTO public.trust_events");
    expect(clientQuery.mock.calls[4][0]).toContain("INSERT INTO public.moderation_flags");
  });
});