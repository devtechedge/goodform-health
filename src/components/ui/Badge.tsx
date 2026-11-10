import React from "react";
import clsx from "clsx";

export type BadgeTone =
  | "neutral"
  | "persimmon"
  | "lilac"
  | "verbena"
  | "amber";

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "neutral" &&
          "border-[var(--gf-border)] bg-[var(--gf-surface-muted)] text-[var(--gf-ink)]",
        tone === "persimmon" &&
          "border-[var(--gf-persimmon)]/30 bg-[var(--gf-persimmon-soft)] text-[var(--gf-persimmon-ink)]",
        tone === "lilac" &&
          "border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] text-[var(--gf-lilac-ink)]",
        tone === "verbena" &&
          "border-[var(--gf-verbena-border)] bg-[var(--gf-verbena-soft)] text-[var(--gf-verbena-ink)]",
        tone === "amber" &&
          "border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] text-[var(--gf-amber-ink)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
