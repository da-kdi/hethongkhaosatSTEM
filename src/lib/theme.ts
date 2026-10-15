const KEY = "stem-theme";
export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyStoredTheme() {
  let t: string | null = null;
  try {
    t = localStorage.getItem(KEY);
  } catch {
    /* bỏ qua */
  }
  const theme = t === "dark" || t === "light" ? t : window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* bỏ qua */
  }
  return next;
}
