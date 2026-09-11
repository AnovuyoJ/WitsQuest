import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import CardsPage from "../app/dashboard/cards/page";
import { supabase } from "../lib/supabaseClient";
import { StrictMode } from "react";

const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as Response;
const card = { id: "gold-card", event_id: "quest", title: "Hall Guardian", description: "A reward for discovering the hall.", rarity: "Gold", points: 90, tag: "History" };
const collection = [0,1,2,3].map(index => ({ id:`copy-${index}`, player_id:"player", event_id:"quest", card_id:card.id, cards:card, awarded_at:"2026-09-01T12:00:00Z" }));

beforeEach(() => {
  request.mockReset(); globalThis.fetch = request;
  jest.spyOn(supabase.auth,"getSession").mockResolvedValue({ data: { session: { access_token:"token" } }, error:null } as never);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  request.mockImplementation(async url => {
    if (String(url).endsWith("/events")) return response([{ id:"quest", title:"Great Hall Quest" }]);
    if (String(url).endsWith("/exchanges")) return response({ owned:4, extras:3, event_title:"Great Hall Quest", targets:[] });
    return response(collection);
  });
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

test("collections hide cards until opened and inspector shows details and exchange controls", async () => {
  render(<StrictMode><CardsPage /></StrictMode>);
  const quest = await screen.findByRole("button", { name:"Open Great Hall Quest collection" });
  expect(screen.queryByRole("button", { name:"Inspect Hall Guardian" })).toBeNull();
  fireEvent.click(quest);
  const inspect = screen.getByRole("button", { name:"Inspect Hall Guardian" });
  expect(screen.queryByText(card.description)).toBeNull();
  inspect.focus();
  fireEvent.click(inspect);
  expect(await screen.findByRole("dialog", { name:"Hall Guardian" })).not.toBeNull();
  expect(screen.getByText(card.description)).not.toBeNull();
  expect(screen.getByText("Copies owned").nextElementSibling?.textContent).toBe("4");
  expect(screen.getByText("Extra copies", { selector: "dt" }).nextElementSibling?.textContent).toBe("3");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name:"Exchange 3 extras" }));
  expect(await screen.findByText(/No unowned published Gold rewards/)).not.toBeNull();
  // The first Close control belongs to the inspector, the second to the exchange panel.
  fireEvent.click(screen.getAllByRole("button", { name:"Close" })[0]);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(inspect);
  expect(document.body.style.overflow).toBe("");
  fireEvent.click(screen.getByRole("button", { name:"← All collections" }));
  expect(screen.queryByRole("button", { name:"Inspect Hall Guardian" })).toBeNull();
  expect(screen.getByRole("button", { name:"Open Great Hall Quest collection" })).not.toBeNull();
});
