"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeSettings() {
  const { darkMode, toggleDarkMode, followSystem, resetToSystemTheme } = useTheme(); // added followSystem and resetToSystemTheme
  return <section className="skeuo-card mb-6 flex items-center justify-between gap-4 p-6" aria-labelledby="appearance-title">
    <div>
      <h2 id="appearance-title" className="text-xl font-bold text-[#043673]">Appearance</h2>
      <p className="mt-2 text-sm text-slate-600">{followSystem ? "Matching your device setting." : "Your choice is saved on this device."}</p>
      {!followSystem && <button type="button" onClick={resetToSystemTheme} className="mt-2 text-sm font-semibold underline">Use device setting</button>}
    </div>
    <button type="button" role="switch" aria-checked={darkMode} aria-label="Dark mode" onClick={toggleDarkMode} className="skeuo-btn-secondary shrink-0 px-4 py-2">
      {darkMode ? "On" : "Off"}
    </button>
  </section>;
}