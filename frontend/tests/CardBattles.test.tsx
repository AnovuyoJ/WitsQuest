import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import GamesPage from "../app/dashboard/games/page";
import DuplicateExchange from "../components/DuplicateExchange";
import RulebookPage from "../app/dashboard/settings/rulebook/page";
import { supabase } from "../lib/supabaseClient";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const push = jest.fn();
const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (data: unknown, status = 200) => ({ ok: status === 200, status, json: async () => data }) as Response;
const cards = ["Gold","Black","Black","Blue","Blue"].map((rarity,index) => ({ id:`card-${index}`,rarity,title:`Card ${index}`,points:90-index*10,event_id:`event-${index}`,tag:"General" }));
beforeEach(() => {
  request.mockReset(); push.mockReset(); globalThis.fetch = request;
  jest.spyOn(supabase.auth,"getSession").mockResolvedValue({ data: { session: { access_token:"token" } },error:null } as never);
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

test("deck builder requires the rarity mix, groups duplicates and sends selected identities to CPU matchmaking", async () => {
  request.mockImplementation(async url => {
    if (String(url).endsWith("/me/cards")) return response([...cards,cards[0]].map((card,index) => ({id:`copy-${index}`,card_id:card.id,cards:card})));
    if (String(url).endsWith("/games/matchmake")) return response({id:"battle"});
    return response([]);
  });
  render(<AppRouterContext.Provider value={{push} as never}><GamesPage /></AppRouterContext.Provider>);
  await screen.findByText("Card 0");
  expect(screen.getAllByText("Card 0")).toHaveLength(1);
  const cpu = screen.getByRole("button",{name:"Play against CPU"}) as HTMLButtonElement;
  expect(cpu.disabled).toBe(true);
  for (const card of cards) fireEvent.click(screen.getByRole("button",{name:new RegExp(card.title)}));
  expect(cpu.disabled).toBe(false);
  fireEvent.click(screen.getByRole("button",{name:/Card 4/}));
  expect(cpu.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button",{name:/Card 4/}));
  fireEvent.click(cpu);
  await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/games/battle"));
  expect(request).toHaveBeenCalledWith(expect.stringContaining("/games/matchmake"),expect.objectContaining({method:"POST",body:JSON.stringify({cardIds:cards.map(c=>c.id),mode:"cpu"})}));
});

test("duplicate exchange previews the selected reward and waits for explicit confirmation", async () => {
  request.mockResolvedValueOnce(response({owned:4,extras:3,event_title:"Campus event",targets:[cards[0]]})).mockResolvedValueOnce(response({card:cards[0]}));
  const complete = jest.fn();
  render(<DuplicateExchange source={{id:"source",title:"Great Hall",rarity:"Gold"}} onClose={() => {}} onComplete={complete} />);
  const choose = await screen.findByRole("combobox");
  expect((screen.getByRole("button",{name:"Confirm exchange"}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(choose,{target:{value:cards[0].id}});
  expect(screen.getByText(/Spend 3 extra copies/).textContent).toContain("keep 1 Great Hall copy");
  expect(request).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button",{name:"Confirm exchange"}));
  await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
  expect(request).toHaveBeenLastCalledWith(expect.stringContaining("/me/cards/exchange"),expect.objectContaining({method:"POST",body:JSON.stringify({sourceCardId:"source",targetCardId:cards[0].id})}));
  expect(screen.getByRole("status").textContent).toContain("Your original Great Hall is safe");
});

test("no eligible exchange rewards preserves extras and offers no spend action", async () => {
  request.mockResolvedValue(response({owned:4,extras:3,event_title:"Campus event",targets:[]}));
  render(<DuplicateExchange source={{id:"source",title:"Great Hall",rarity:"Gold"}} onClose={() => {}} onComplete={() => {}} />);
  expect(await screen.findByText(/No unowned published Gold rewards/)).not.toBeNull();
  expect(screen.queryByRole("button",{name:"Confirm exchange"})).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
});

test("rulebook explains deck constraints, CPU privacy and same-event exchange", () => {
  render(<RulebookPage />);
  expect(screen.getByText(/Choose exactly 1 Gold, 2 Black and 2 Blue/)).not.toBeNull();
  expect(screen.getByText(/commits to a shuffled card order/)).not.toBeNull();
  expect(screen.getByText(/Exchange 3 extra copies/)).not.toBeNull();
  expect(screen.getByRole("link",{name:/Settings/}).getAttribute("href")).toBe("/dashboard/settings");
});
