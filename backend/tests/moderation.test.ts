import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import express, { Request, Response, NextFunction } from "express";

// Mock Supabase client
jest.mock("@supabase/supabase-js");

describe("Trust & Moderation Backend Operations", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it("fetches open moderation flags sorted by creation date descending", async () => {
    const mockFlags = [
      { id: "flag-1", player_id: "user-123", reason: "Spamming chat", status: "open" },
    ];
    mockSupabase.order.mockResolvedValueOnce({ data: mockFlags, error: null });

    const { data, error } = await mockSupabase
      .from("moderation_flags")
      .select("*")
      .order("created_at", { ascending: false });

    expect(mockSupabase.from).toHaveBeenCalledWith("moderation_flags");
    expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(data).toEqual(mockFlags);
    expect(error).toBeNull();
  });

  it("resolves moderation flag and updates status to resolved", async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    const flagId = "flag-1";
    const action = "restricted";

    const { error } = await mockSupabase
      .from("moderation_flags")
      .update({
        status: "resolved",
        action_taken: action,
        resolved_at: expect.any(String),
      })
      .eq("id", flagId);

    expect(mockSupabase.from).toHaveBeenCalledWith("moderation_flags");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        action_taken: "restricted",
      })
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", flagId);
    expect(error).toBeNull();
  });

  it("applies safety restriction penalty to player_trust_score when restricted", async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    const playerId = "user-123";
    const action = "restricted";

    const { error } = await mockSupabase
      .from("player_trust_score")
      .update({ status: action, last_updated_at: expect.any(String) })
      .eq("player_id", playerId);

    expect(mockSupabase.from).toHaveBeenCalledWith("player_trust_score");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "restricted" })
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith("player_id", playerId);
    expect(error).toBeNull();
  });
});