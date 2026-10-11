import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import ThemeProvider, { useTheme } from "@/components/ThemeProvider";
import { PALETTE_STORAGE_KEY, THEME_STORAGE_KEY, themeInitScript } from "@/lib/theme";

function Toggle() {
  const { darkMode, toggleDarkMode, palette, setPalette } = useTheme();
  return <><button onClick={toggleDarkMode}>{darkMode ? "dark" : "light"}</button><button onClick={() => setPalette("forest")}>Choose forest</button><span data-testid="palette">{palette}</span></>;
}

let systemDark = false;
let change: () => void;
beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.palette;
  systemDark = false;
  Object.defineProperty(window, "matchMedia", { configurable: true, value: jest.fn(() => ({
    get matches() { return systemDark; },
    addEventListener: jest.fn((_event: string, listener: () => void) => { change = listener; }),
    removeEventListener: jest.fn(),
  })) });
});

test("colour palette persists independently of light and dark mode", () => {
  const view = render(<ThemeProvider><Toggle /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Choose forest" }));
  expect(document.documentElement.dataset.palette).toBe("forest");
  expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("forest");
  fireEvent.click(screen.getByRole("button", { name: "light" }));
  expect(document.documentElement.dataset.palette).toBe("forest");
  view.unmount();
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(screen.getByTestId("palette").textContent).toBe("forest");
  expect(document.documentElement.dataset.theme).toBe("dark");
});

test("initial script restores palette and rejects unknown saved palettes", () => {
  localStorage.setItem(PALETTE_STORAGE_KEY, "forest");
  window.eval(themeInitScript);
  expect(document.documentElement.dataset.palette).toBe("forest");
  localStorage.setItem(PALETTE_STORAGE_KEY, "unknown");
  window.eval(themeInitScript);
  expect(document.documentElement.dataset.palette).toBe("wits");
});

test.each(["ocean", "plum", "blush"])("restores %s before hydration and keeps it when switching modes", (palette) => {
  localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  window.eval(themeInitScript);
  expect(document.documentElement.dataset.palette).toBe(palette);
  expect(document.documentElement.dataset.theme).toBe("dark");
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(screen.getByTestId("palette").textContent).toBe(palette);
  fireEvent.click(screen.getByRole("button", { name: "dark" }));
  expect(document.documentElement.dataset.palette).toBe(palette);
  expect(document.documentElement.dataset.theme).toBe("light");
});

test("syncs palette changes from other tabs", () => {
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  localStorage.setItem(PALETTE_STORAGE_KEY, "forest");
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: PALETTE_STORAGE_KEY })));
  expect(screen.getByTestId("palette").textContent).toBe("forest");
});

test.each(["sage-rose", "raspberry"])("replaces saved %s selections with Blush", (previousPalette) => {
  localStorage.setItem(PALETTE_STORAGE_KEY, previousPalette);
  window.eval(themeInitScript);
  expect(document.documentElement.dataset.palette).toBe("blush");
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(screen.getByTestId("palette").textContent).toBe("blush");
});

test("initial script applies the saved preference before hydration", () => {
  systemDark = true;
  localStorage.setItem(THEME_STORAGE_KEY, "light");
  window.eval(themeInitScript);
  expect(document.documentElement.dataset.theme).toBe("light");
});

test("toggle updates the document and persists across remounts", () => {
  const view = render(<ThemeProvider><Toggle /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "light" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  view.unmount();
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(screen.getByRole("button", { name: "dark" })).toBeTruthy();
});

test("follows system changes until the user selects a preference", () => {
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  act(() => { systemDark = true; change(); });
  expect(document.documentElement.dataset.theme).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "dark" }));
  act(() => { change(); });
  expect(document.documentElement.dataset.theme).toBe("light");
});

test("syncs changes from other tabs", () => {
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY })));
  expect(screen.getByRole("button", { name: "dark" })).toBeTruthy();
});

test("still toggles when storage is unavailable", () => {
  const read = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("disabled"); });
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("disabled"); });
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  fireEvent.click(screen.getByRole("button", { name: "light" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  read.mockRestore();
  write.mockRestore();
});
