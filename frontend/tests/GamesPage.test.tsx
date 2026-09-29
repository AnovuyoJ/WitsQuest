import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import GamesPage from "../app/dashboard/games/page";
import { supabase } from "../lib/supabaseClient";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const push = jest.fn();
const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (data: unknown, status = 200) =>
  ({ ok: status === 200, status, json: async () => data }) as Response;

const mockCards = [
  { id: "gold-1", rarity: "Gold", title: "Gold Card 1", points: 90, event_id: "e1", tag: "General" },
  { id: "gold-2", rarity: "Gold", title: "Gold Card 2", points: 85, event_id: "e1", tag: "General" },
  { id: "black-1", rarity: "Black", title: "Black Card 1", points: 70, event_id: "e1", tag: "General" },
  { id: "black-2", rarity: "Black", title: "Black Card 2", points: 65, event_id: "e1", tag: "General" },
  { id: "black-3", rarity: "Black", title: "Black Card 3", points: 60, event_id: "e1", tag: "General" },
  { id: "blue-1", rarity: "Blue", title: "Blue Card 1", points: 50, event_id: "e1", tag: "General" },
  { id: "blue-2", rarity: "Blue", title: "Blue Card 2", points: 40, event_id: "e1", tag: "General" },
  { id: "invalid-1", rarity: "Blue", title: "Invalid Card", points: 150, event_id: "e1", tag: "General" },
];

const mockPlayers = [
  { id: "player-a", name: "Thandi M.", email: "thandi@wits.ac.za" },
  { id: "player-b", name: "Sipho K.",  email: "sipho@wits.ac.za"  },
];

const mockTrades = [
  {
    id: "trade-1",
    sender_id: "player-a",
    recipient_id: "me",
    sender_name: "Thandi M.",
    recipient_name: "Me",
    offered_title: "Gold Card 1",
    offered_rarity: "Gold",
    offered_points: 90,
    requested_title: "Black Card 1",
    requested_rarity: "Black",
    requested_points: 70,
    status: "pending" as const,
    created_at: "2025-01-01T00:00:00Z",
  },
];

beforeEach(() => {
  request.mockReset();
  push.mockReset();
  globalThis.fetch = request;
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({
    data: { session: { access_token: "token" } },
    error: null,
  } as never);
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

function renderGamesPage() {
  return render(
    <AppRouterContext.Provider value={{ push } as never}>
      <GamesPage />
    </AppRouterContext.Provider>
  );
}

// Scope queries to the card locker, so trade-UI chips that share card titles
// don't collide with the collection cards.
const locker = () => within(screen.getByRole("region", { name: "Card locker" }));

test("renders collection loading error message when API fails", async () => {
  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/me/cards"))
      return response({ message: "Failed to fetch collection" }, 400);
    return response([]);
  });

  renderGamesPage();

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Failed to fetch collection");
});

test("enforces rarity limits when toggling card selection", async () => {
  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/me/cards"))
      return response(
        mockCards.map((card) => ({ id: `usr-${card.id}`, card_id: card.id, cards: card }))
      );
    return response([]);
  });

  renderGamesPage();
  await waitFor(() => expect(locker().getByText("Gold Card 1")).not.toBeNull());

  // Select 1 Gold card
  fireEvent.click(locker().getByRole("button", { name: /Gold Card 1/ }));
  // Attempt to select a 2nd Gold card -> exceeds limit of 1
  fireEvent.click(locker().getByRole("button", { name: /Gold Card 2/ }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Your deck already has 1 Gold card.");

  // Select 2 Black cards
  fireEvent.click(locker().getByRole("button", { name: /Black Card 1/ }));
  fireEvent.click(locker().getByRole("button", { name: /Black Card 2/ }));
  // Attempt to select a 3rd Black card -> exceeds limit of 2
  fireEvent.click(locker().getByRole("button", { name: /Black Card 3/ }));

  expect(screen.getByRole("alert").textContent).toContain("Your deck already has 2 Black cards.");
});

test("handles matchmaking errors gracefully when start fails", async () => {
  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/me/cards")) {
      const validDeckCards = [
        mockCards[0], // Gold
        mockCards[2], // Black
        mockCards[3], // Black
        mockCards[5], // Blue
        mockCards[6], // Blue
      ];
      return response(
        validDeckCards.map((card) => ({ id: `usr-${card.id}`, card_id: card.id, cards: card }))
      );
    }
    if (String(url).endsWith("/games/matchmake")) {
      return response({ message: "Matchmaker offline" }, 500);
    }
    return response([]);
  });

  renderGamesPage();
  await waitFor(() => expect(locker().getByText("Gold Card 1")).not.toBeNull());

  // Select valid 5-card deck
  fireEvent.click(locker().getByRole("button", { name: /Gold Card 1/ }));
  fireEvent.click(locker().getByRole("button", { name: /Black Card 1/ }));
  fireEvent.click(locker().getByRole("button", { name: /Black Card 2/ }));
  fireEvent.click(locker().getByRole("button", { name: /Blue Card 1/ }));
  fireEvent.click(locker().getByRole("button", { name: /Blue Card 2/ }));

  const playerBtn = screen.getByRole("button", { name: "Find a player" });
  fireEvent.click(playerBtn);

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Matchmaker offline");
});

test("cancels a waiting lobby and handles active game forfeit workflows", async () => {
  const pendingGames = [
    { id: "game-waiting", status: "waiting", is_cpu: false, rules_version: 2 },
    { id: "game-active", status: "active", is_cpu: true, rules_version: 1 },
  ];

  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/me/cards")) return response([]);
    if (String(url).endsWith("/games")) return response(pendingGames);
    if (String(url).endsWith("/games/game-waiting/cancel")) return response({ ok: true });
    if (String(url).endsWith("/games/game-active/forfeit")) return response({ ok: true });
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Your battles");

  const cancelBtn = screen.getByRole("button", { name: "Cancel lobby" });
  fireEvent.click(cancelBtn);

  await waitFor(() => {
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("/games/game-waiting/cancel"),
      expect.objectContaining({ method: "POST" })
    );
  });

  const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
  const forfeitBtn = screen.getByRole("button", { name: "Forfeit" });
  fireEvent.click(forfeitBtn);

  expect(confirmSpy).toHaveBeenCalledWith("Forfeit this match? Your opponent wins.");
  expect(request).not.toHaveBeenCalledWith(
    expect.stringContaining("/games/game-active/forfeit"),
    expect.anything()
  );

  confirmSpy.mockReturnValue(true);
  fireEvent.click(forfeitBtn);

  await waitFor(() => {
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("/games/game-active/forfeit"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

test("displays error message when cancelling or forfeiting a game fails", async () => {
  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/games"))
      return response([{ id: "game-1", status: "waiting", is_cpu: false, rules_version: 2 }]);
    if (String(url).endsWith("/games/game-1/cancel"))
      return response({ message: "Unable to cancel game" }, 400);
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Your battles");

  fireEvent.click(screen.getByRole("button", { name: "Cancel lobby" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Unable to cancel game");
});

test("displays empty state when player has no cards in collection", async () => {
  request.mockImplementation(async () => response([]));

  renderGamesPage();

  expect(await screen.findByText("Your deck starts with your collection")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Find an event" })).not.toBeNull();
});

test("flags cards with invalid point ranges", async () => {
  request.mockImplementation(async (url) => {
    if (String(url).endsWith("/me/cards"))
      return response([
        { id: "usr-invalid", card_id: "invalid-1", cards: mockCards[7] },
      ]);
    return response([]);
  });

  renderGamesPage();

  expect(await screen.findByText("Needs an admin point correction before use.")).not.toBeNull();
});

test("renders the incoming trades list with counterparty and status", async () => {
  request.mockImplementation(async (url) => {
    const u = String(url);
    if (u.endsWith("/me/cards"))            return response([]);
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades"))              return response(mockTrades);
    return response([]);
  });

  renderGamesPage();

  expect(await screen.findByText("Thandi M. → Me")).not.toBeNull();
  expect(
    screen.getByText(/Offering Gold Card 1 for Black Card 1 · Status: pending/)
  ).not.toBeNull();
});

test("accepts a pending trade when the recipient clicks Accept", async () => {
  const acceptCalls: string[] = [];

  request.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/me/cards"))            return response([]);
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades/trade-1/accept") && init?.method === "POST") {
      acceptCalls.push(u);
      return response({ success: true });
    }
    if (u.endsWith("/trades")) return response(mockTrades);
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Thandi M. → Me");

  fireEvent.click(screen.getByRole("button", { name: "Accept" }));

  await waitFor(() => expect(acceptCalls).toHaveLength(1));
});

test("cancels a pending trade", async () => {
  const cancelCalls: string[] = [];

  request.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/me/cards"))            return response([]);
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades/trade-1/cancel") && init?.method === "POST") {
      cancelCalls.push(u);
      return response({ success: true });
    }
    if (u.endsWith("/trades")) return response(mockTrades);
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Thandi M. → Me");

  const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
  fireEvent.click(cancelButtons[0]);

  await waitFor(() => expect(cancelCalls).toHaveLength(1));
});

test("proposes a trade with recipient and both card ids", async () => {
  const posted: { url: string; body: unknown }[] = [];

  request.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/me/cards")) {
      return response([
        { id: "usr-gold-1",  card_id: "gold-1",  cards: mockCards[0] },
        { id: "usr-black-1", card_id: "black-1", cards: mockCards[2] },
      ]);
    }
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades/players/player-a/cards")) {
      return response([
        { id: "black-3", title: "Black Card 3", rarity: "Black", points: 60 },
        { id: "blue-1",  title: "Blue Card 1",  rarity: "Blue",  points: 50 },
      ]);
    }
    if (u.endsWith("/trades")) {
      if (init?.method === "POST") {
        posted.push({ url: u, body: JSON.parse(String(init.body)) });
        return response({ success: true });
      }
      return response([]);
    }
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Player trades");

  // Select the recipient — label is "Trade with", not "Trade recipient".
  fireEvent.change(screen.getByLabelText(/Trade with/), {
    target: { value: "player-a" },
  });

  // Recipient's cards render as role="radio" chips inside the "Requested card" radiogroup.
  const requestedGroup = screen.getByRole("radiogroup", { name: "Requested card" });
  await within(requestedGroup).findByRole("radio", { name: /Black Card 3/ });

  // Click the offered chip in the "Offered card" radiogroup.
  const offeredGroup = screen.getByRole("radiogroup", { name: "Offered card" });
  fireEvent.click(within(offeredGroup).getByRole("radio", { name: /Gold Card 1/ }));

  // Click the requested chip.
  fireEvent.click(within(requestedGroup).getByRole("radio", { name: /Black Card 3/ }));

  fireEvent.click(screen.getByRole("button", { name: "Propose trade" }));

  await waitFor(() => expect(posted).toHaveLength(1));
  expect(posted[0].body).toEqual({
    recipientId: "player-a",
    offeredCardId: "gold-1",
    requestedCardId: "black-3",
  });
});

test("shows an error when proposing a trade fails", async () => {
  request.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/me/cards")) {
      return response([
        { id: "usr-gold-1", card_id: "gold-1", cards: mockCards[0] },
      ]);
    }
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades/players/player-a/cards")) {
      return response([
        { id: "black-3", title: "Black Card 3", rarity: "Black", points: 60 },
      ]);
    }
    if (u.endsWith("/trades")) {
      if (init?.method === "POST") {
        return response({ message: "Recipient already has a pending trade" }, 409);
      }
      return response([]);
    }
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Player trades");

  fireEvent.change(screen.getByLabelText(/Trade with/), {
    target: { value: "player-a" },
  });

  const requestedGroup = screen.getByRole("radiogroup", { name: "Requested card" });
  await within(requestedGroup).findByRole("radio", { name: /Black Card 3/ });

  const offeredGroup = screen.getByRole("radiogroup", { name: "Offered card" });
  fireEvent.click(within(offeredGroup).getByRole("radio", { name: /Gold Card 1/ }));
  fireEvent.click(within(requestedGroup).getByRole("radio", { name: /Black Card 3/ }));

  fireEvent.click(screen.getByRole("button", { name: "Propose trade" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Recipient already has a pending trade");
});

test("recipient can reject a pending trade", async () => {
  const rejectCalls: string[] = [];

  request.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/me/cards"))            return response([]);
    if (u.endsWith("/trades/players/list")) return response(mockPlayers);
    if (u.endsWith("/trades/trade-1/reject") && init?.method === "POST") {
      rejectCalls.push(u);
      return response({ success: true });
    }
    if (u.endsWith("/trades")) return response(mockTrades);
    return response([]);
  });

  renderGamesPage();
  await screen.findByText("Thandi M. → Me");

  fireEvent.click(screen.getByRole("button", { name: "Reject" }));

  await waitFor(() => expect(rejectCalls).toHaveLength(1));
});