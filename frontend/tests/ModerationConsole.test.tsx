import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ModerationConsolePage from "@/app/dashboard/admin/moderation/page";
import ModerationHelpPage from "@/app/dashboard/admin/moderation/help/page";
import "@testing-library/jest-dom";

const mockApiRequest = jest.fn();

jest.mock("../lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe("ModerationConsolePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads the open queue and displays its current empty state", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null });

    render(<ModerationConsolePage />);

    expect(screen.getByText("Loading safety flags...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No cases match this status.")).toBeInTheDocument();
    });
    expect(mockApiRequest).toHaveBeenCalledWith("/admin/moderation/flags?status=open");
  });

  test("renders case details and submits an admin restriction action", async () => {
    const mockData = [
      {
        id: "flag-1",
        player_id: "user-999-abc-def",
        reason: "Suspected cheating in challenge",
        status: "open",
        action_taken: "none",
        created_at: new Date().toISOString(),
        trust_score: 45,
        severity: 3,
        event_types: ["location_anomaly"],
      },
    ];

    mockApiRequest.mockResolvedValue({ data: mockData, error: null });

    render(<ModerationConsolePage />);

    await waitFor(() => {
      expect(screen.getByText("Suspected cheating in challenge")).toBeInTheDocument();
      expect(screen.getByText("user-999...")).toBeInTheDocument();
      expect(screen.getByText("location_anomaly")).toBeInTheDocument();
      expect(screen.getByText("3/5")).toBeInTheDocument();
      expect(screen.getByText((_, element) => element?.tagName === "TD" && element.textContent?.replace(/\s/g, "") === "45/100")).toBeInTheDocument();
    });

    const restrictButton = screen.getByRole("button", { name: "Restrict" });
    fireEvent.click(restrictButton);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/admin/moderation/flags/flag-1/action",
        "POST",
        { action: "restricted" },
      );
    });
    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByText("Loading safety flags...")).not.toBeInTheDocument());
  });

  test("status filter requests the selected case status", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null });
    render(<ModerationConsolePage />);
    fireEvent.change(screen.getByLabelText("Case status"), { target: { value: "resolved" } });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith("/admin/moderation/flags?status=resolved");
    });
    await screen.findByText("No cases match this status.");
  });

  test("question-mark link opens the guide with the moderation policy", async () => {
    render(<ModerationConsolePage />);
    await screen.findByText("No cases match this status.");
    expect(screen.getByRole("link", { name: "Trust and moderation help" })).toHaveAttribute(
      "href",
      "/dashboard/admin/moderation/help",
    );

    render(<ModerationHelpPage />);
    expect(screen.getByRole("heading", { name: "Trust & Moderation Guide" })).toBeInTheDocument();
    expect(screen.getByText(/three within 30 days/)).toBeInTheDocument();
    expect(screen.getByText(/Temporary restrictions expire/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to desk" })).toHaveAttribute(
      "href",
      "/dashboard/admin/moderation",
    );
  });
});