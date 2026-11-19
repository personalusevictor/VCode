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
  const [motionPaused, setMotionPaused] = useState(false);
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
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#11151b" : "#f2f1eb");
    try {
      localStorage.setItem("vcode-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <PreferencesContext.Provider
      value={{ theme, setTheme, motionPaused, setMotionPaused, reducedMotion }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
