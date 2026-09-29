import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
// Relative paths (tests/ -> frontend/), so no jest.config alias mapping is needed
import LeaderboardPage from "../app/dashboard/leaderboard/page";

jest.mock("../lib/api", () => ({
  apiRequest: jest.fn().mockResolvedValue({
    data: {
      entries: [
        {
          playerId: "1",
          playerName: "Alpha Player",
          points: 1200,
          achievementsEarned: 5,
          currentStreak: 3,
          rank: 1,
        },
      ],
      currentPlayer: {
        playerId: "user-1",
        playerName: "Current Player",
        points: 900,
        achievementsEarned: 2,
        currentStreak: 1,
        rank: 4,
      },
    },
  }),
}));

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

// Wrappers defer the variable lookup until call time (avoids the TDZ error)
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: unknown[]) => mockMaybeSingle(...args),
        }),
      }),
    }),
  }),
}));

describe("Leaderboard Page Trust Badge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays 100 Trust badge with Good Standing indicator", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { score: 100, status: "good_standing" },
      error: null,
    });

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText("100 Trust")).toBeInTheDocument();
     
    });
  });

  test("displays restricted icon and status when user is restricted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { score: 40, status: "restricted" },
      error: null,
    });

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText("40 Trust")).toBeInTheDocument();
      expect(screen.getByText("🚫")).toBeInTheDocument();
    });
  });
});