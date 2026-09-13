import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, jest, test } from "@jest/globals";
import "@testing-library/jest-dom/jest-globals";
import PhotoEditor from "../components/PhotoEditor";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; jest.restoreAllMocks(); });
test("cover selection previews before saving and can restore automatic selection", async () => {
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never);
  const request = jest.fn<typeof fetch>().mockResolvedValue({ ok: true, json: async () => ({ image: null }) } as Response);
  globalThis.fetch = request;
  render(<PhotoEditor endpoint="/admin/events/quest/album-cover" album />);
  const picker = await screen.findByRole("combobox", { name: "Choose a Wits photo" });
  fireEvent.change(picker, { target: { value: "/wits%20pictures/wits%20library.jpg" } });
  expect(screen.getByAltText("Album cover preview")).toHaveAttribute("src", "/wits%20pictures/wits%20library.jpg");
  expect(request).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Save picture" }));
  await screen.findByText("Picture saved.");
  expect(request).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: "PUT", body: JSON.stringify({ image: "/wits%20pictures/wits%20library.jpg" }) }));
  fireEvent.click(screen.getByRole("button", { name: "Use automatic photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Save picture" }));
  await waitFor(() => expect(request).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ image: null }) })));
});

test("failed profile save shows the error without claiming success", async () => {
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never);
  globalThis.fetch = jest.fn<typeof fetch>()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ avatar: null }) } as Response)
    .mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: "Could not save photo." }) } as Response);
  render(<PhotoEditor endpoint="/me/profile" />);
  fireEvent.click(await screen.findByRole("button", { name: "Save picture" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save photo.");
  expect(screen.queryByText("Picture saved.")).toBeNull();
});
