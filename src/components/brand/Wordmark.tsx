import React from "react";
import clsx from "clsx";

export interface WordmarkProps {
  className?: string;
  showSubline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Wordmark({
  className,
  showSubline = false,
  size = "md",
}: WordmarkProps) {
  const iconSize = size === "sm" ? 24 : size === "lg" ? 36 : 28;
  const textSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-xl sm:text-2xl";

  return (
    <span className={clsx("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="32"
          height="32"
          rx="10"
          fill="var(--gf-aubergine)"
        />
        <rect
          x="10.5"
          y="7.5"
          width="15"
          height="21"
          rx="7.5"
          stroke="var(--gf-on-aubergine)"
          strokeWidth="2"
        />
        <path
          d="M10.5 18H25.5"
          stroke="var(--gf-on-aubergine)"
          strokeWidth="1.75"
        />
        <circle cx="18" cy="13" r="2.3" fill="var(--gf-persimmon)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "font-display tracking-[0.06em] font-normal text-[var(--gf-ink)]",
            textSize,
          )}
        >
          GOOD<span className="text-[var(--gf-persimmon)]">FORM</span>
        </span>
        {showSubline ? (
          <span className="mt-0.5 font-mono-label text-[10px] uppercase tracking-[0.18em] text-[var(--gf-ink-muted)]">
            Everyday Apothecary · IN
          </span>
        ) : null}
      </span>
    </span>
  );
}
