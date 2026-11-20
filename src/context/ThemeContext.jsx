import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  isThemePreference,
  resolveTheme,
  THEME_PREFERENCE_KEY,
} from "../utils/themePreference";

const ThemeContext = createContext(null);

export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(preference) {
  if (typeof document === "undefined") return;
  const systemPrefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveTheme(preference, systemPrefersDark);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function initializeTheme() {
  applyTheme(getStoredTheme());
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [theme]);

  const setTheme = (nextTheme) => {
    if (!isThemePreference(nextTheme)) return;
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_PREFERENCE_KEY, nextTheme);
    } catch {
      // The current tab still applies the choice when browser storage is unavailable.
    }
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
