"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "goodform_theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage restriction errors in private browsing.
    }
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
