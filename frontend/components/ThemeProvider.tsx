"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

import { palettes, PALETTE_STORAGE_KEY, THEME_STORAGE_KEY, type Palette } from "@/lib/theme";

const ThemeContext = createContext<{ darkMode: boolean; toggleDarkMode: () => void; palette: Palette; setPalette: (palette: Palette) => void }>({ darkMode: false, toggleDarkMode: () => {}, palette: "wits", setPalette: () => {} });

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [palette, updatePalette] = useState<Palette>("wits");

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
      const dark = saved === "dark" || (saved !== "light" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      setDarkMode(dark);
      let savedPalette: string | null = null;
      try { savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
      if (savedPalette === "sage-rose" || savedPalette === "raspberry") savedPalette = "blush";
      const nextPalette = palettes.find(option => option.id === savedPalette)?.id ?? "wits";
      document.documentElement.dataset.palette = nextPalette;
      updatePalette(nextPalette);
    };
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === PALETTE_STORAGE_KEY || event.key === null) sync();
    };
    media.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleDarkMode = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDarkMode(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light"); } catch { /* Keep the in-memory choice. */ }
  };

  const setPalette = (next: Palette) => {
    document.documentElement.dataset.palette = next;
    updatePalette(next);
    try { localStorage.setItem(PALETTE_STORAGE_KEY, next); } catch { /* Keep the in-memory choice. */ }
  };

  return <ThemeContext.Provider value={{ darkMode, toggleDarkMode, palette, setPalette }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
