import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ModerationConsolePage from "@/app/dashboard/admin/moderation/page";
import "@testing-library/jest-dom";

// Mock Supabase
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        order: mockSelect,
      }),
      update: (data: Record<string, unknown>) => {
  mockUpdate(data);
  return { eq: mockEq };
},
    }),
  }),
}));

describe("ModerationConsolePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders empty state when no open flags are found", async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    render(<ModerationConsolePage />);

    expect(screen.getByText("Loading safety flags...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No open moderation flags found.")).toBeInTheDocument();
    });
  });

  test("renders flag table and triggers restriction action on click", async () => {
    const mockData = [
      {
        id: "flag-1",
        player_id: "user-999-abc",
        reason: "Suspected cheating in challenge",
        status: "open",
        action_taken: "none",
        created_at: new Date().toISOString(),
      },
    ];

    mockSelect.mockResolvedValue({ data: mockData, error: null });
    mockEq.mockResolvedValue({ error: null });

    render(<ModerationConsolePage />);

    await waitFor(() => {
      expect(screen.getByText("Suspected cheating in challenge")).toBeInTheDocument();
      expect(screen.getByText("user-999...")).toBeInTheDocument();
    });

    const restrictButton = screen.getByRole("button", { name: "Restrict" });
    fireEvent.click(restrictButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "resolved", action_taken: "restricted" })
      );
    });
  });
});