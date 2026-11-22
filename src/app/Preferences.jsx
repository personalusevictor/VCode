import React, { createContext, useContext, useEffect, useState } from "react";

const PreferencesContext = createContext(null);

function readTheme() {
  try {
    const saved = localStorage.getItem("vcode-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);
  const [motionPaused, setMotionPaused] = useState(() => {
    try {
      return localStorage.getItem("vcode-motion-paused") === "true";
    } catch {
      return false;
    }
  });
  const [searchShortcut, setSearchShortcut] = useState(() => {
    try {
      return localStorage.getItem("vcode-search-shortcut") !== "false";
    } catch {
      return true;
    }
  });
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("vcode-motion-paused", String(motionPaused));
    } catch {}
  }, [motionPaused]);

  useEffect(() => {
    try {
      localStorage.setItem("vcode-search-shortcut", String(searchShortcut));
    } catch {}
  }, [searchShortcut]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const background = getComputedStyle(root).getPropertyValue("--bg").trim();
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", background);
    try {
      localStorage.setItem("vcode-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        motionPaused,
        setMotionPaused,
        reducedMotion,
        searchShortcut,
        setSearchShortcut,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
