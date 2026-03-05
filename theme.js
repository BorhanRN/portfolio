const THEME_STORAGE_KEY = "portfolio-theme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";
const THEME_SWITCHING_CLASS = "theme-switching";
const THEME_TRANSITION_MS = 430;

const themeRoot = document.documentElement;
const themeToggleButtons = document.querySelectorAll(".theme-toggle");
let themeTransitionTimeoutId = null;

function readSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === THEME_DARK || savedTheme === THEME_LIGHT) {
      return savedTheme;
    }
  } catch {
    // Ignore storage errors and fall back to default theme.
  }
  return THEME_DARK;
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors to avoid breaking theme toggling.
  }
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function applyTheme(theme) {
  const nextTheme = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  themeRoot.setAttribute("data-theme", nextTheme);

  const showingLight = nextTheme === THEME_LIGHT;
  themeToggleButtons.forEach((button) => {
    const nextLabel = showingLight
      ? "Switch to dark mode"
      : "Switch to light mode";

    button.setAttribute("aria-pressed", String(showingLight));
    button.setAttribute("aria-label", nextLabel);
    button.setAttribute("title", nextLabel);
    // Horizon toggle animates based on this class.
    button.classList.toggle("theme-toggle--toggled", !showingLight);
  });
}

function startThemeTransition() {
  if (prefersReducedMotion()) {
    return;
  }

  themeRoot.classList.add(THEME_SWITCHING_CLASS);
  // Force style recalculation so transition rules are active before theme values change.
  void themeRoot.offsetHeight;

  if (themeTransitionTimeoutId) {
    window.clearTimeout(themeTransitionTimeoutId);
  }

  themeTransitionTimeoutId = window.setTimeout(() => {
    themeRoot.classList.remove(THEME_SWITCHING_CLASS);
    themeTransitionTimeoutId = null;
  }, THEME_TRANSITION_MS);
}

let currentTheme = readSavedTheme();
applyTheme(currentTheme);

themeToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startThemeTransition();
    currentTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(currentTheme);
    saveTheme(currentTheme);
  });
});
