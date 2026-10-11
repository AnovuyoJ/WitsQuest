import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import DashboardTopbar from "@/components/DashboardTopbar";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { supabase } from "../lib/supabaseClient";

beforeEach(() => {
  jest.spyOn(supabase.auth, "getUser").mockResolvedValue({ data: { user: null }, error: null } as never);
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: null }, error: null } as never);
  jest.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } } as never);
});
afterEach(() => { jest.restoreAllMocks(); });
const renderBar = (pathname = "/dashboard") => render(<PathnameContext.Provider value={pathname}><DashboardTopbar /></PathnameContext.Provider>);

test("searches player pages and offers their actual routes", async () => {
  renderBar();
  await screen.findByRole("button", { name: "Open profile menu" });
  const search = screen.getByRole("textbox", { name: "Search pages" });
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: "trail" } });
  expect(screen.getByRole("link", { name: /Trails/ }).getAttribute("href")).toBe("/dashboard/trails");
  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.queryByRole("navigation", { name: "Page search results" })).toBeNull();
});

test("admin search points to admin workspaces", async () => {
  renderBar("/dashboard/admin/events");
  await screen.findByRole("button", { name: "Open profile menu" });
  const search = screen.getByRole("textbox", { name: "Search pages" });
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: "zones" } });
  expect(screen.getByRole("link", { name: /Zones/ }).getAttribute("href")).toBe("/dashboard/admin/zones");
});

test("shows an empty result and dismisses search with Escape", async () => {
  renderBar();
  await screen.findByRole("button", { name: "Open profile menu" });
  const search = screen.getByRole("textbox", { name: "Search pages" });
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: "missing page" } });
  expect(screen.getByText("No pages found.")).toBeTruthy();
  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.queryByText("No pages found.")).toBeNull();
});
