import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import TrailsPage from "../app/dashboard/trails/page";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
beforeEach(() => {
  request.mockReset(); globalThis.fetch = request;
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never);
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

test("guided stops retain server order and link to the next quest", async () => {
  request.mockResolvedValue(response([{ id: "trail", title: "History walk", description: "Explore campus", completed_stops: 1, next_event_id: "next",
    stops: [
      { event_id: "done", position: 1, event_title: "Library", completed: true, available: true, active: true },
      { event_id: "next", position: 2, event_title: "Great Hall", completed: false, available: true, active: true, total_questions: 2, completed_questions: 0 },
      { event_id: "missing", position: 3, event_title: null, completed: false, available: false, active: false },
    ] }]));
  render(<TrailsPage />);
  fireEvent.click(await screen.findByText("History walk"));
  expect(screen.getAllByRole("listitem").map(item => item.querySelector("h3")?.textContent)).toEqual(["✓ Library", "Great Hall", "Stop unavailable"]);
  expect(screen.getByText("Visit next stop").getAttribute("href")).toBe("/dashboard/events#quest-next");
  expect(screen.getByText("Visit next stop").closest("li")?.getAttribute("aria-current")).toBe("step");
});

test("empty published trails have a useful message", async () => {
  request.mockResolvedValue(response([]));
  render(<TrailsPage />);
  expect(await screen.findByText(/No trails published yet/)).not.toBeNull();
});
