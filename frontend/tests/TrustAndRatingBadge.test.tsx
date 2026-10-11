import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TrustAndRatingBadge from "@/components/TrustAndRatingBadge";

const mockApiRequest = jest.fn();

jest.mock("../lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe("TrustAndRatingBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders safely when the stats response omits rating history", async () => {
    mockApiRequest.mockResolvedValue({
      data: {
        rating: 1200,
        season: "Season 1",
        trustScore: 100,
        trustStatus: "normal",
      },
    });

    render(<TrustAndRatingBadge />);

    expect(await screen.findByText("1200 ELO")).toBeInTheDocument();
    expect(screen.getByText("No completed seasons yet.")).toBeInTheDocument();
  });
});
