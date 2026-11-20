export const THEME_PREFERENCE_KEY = "spellycraft_theme";

export function isThemePreference(value) {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(preference, systemPrefersDark) {
  return preference === "dark" || (preference === "system" && systemPrefersDark)
    ? "dark"
    : "light";
}
