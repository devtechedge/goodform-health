"use client";

import React, { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "goodform_theme";
const THEME_CHANGE_EVENT = "goodform-theme-change";

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getClientThemeSnapshot(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getClientThemeSnapshot,
    getServerThemeSnapshot,
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage restriction errors in private browsing.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const label = mounted
    ? theme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle colour theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)] text-[var(--gf-ink)] transition-colors hover:border-[var(--gf-border-strong)] hover:bg-[var(--gf-surface-muted)]"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "dark"
            ? "scale-100 opacity-100"
            : "scale-50 opacity-0 absolute"
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${
          theme === "light"
            ? "scale-100 opacity-100"
            : "scale-50 opacity-0 absolute"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
