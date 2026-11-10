import React from "react";
import clsx from "clsx";

export interface CalloutProps {
  tone?: "info" | "caution" | "verified" | "persimmon";
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: CalloutProps) {
  return (
    <aside
      aria-label={title}
      className={clsx(
        "rounded-2xl border p-4 text-sm leading-relaxed",
        tone === "info" &&
          "border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] text-[var(--gf-lilac-ink)]",
        tone === "caution" &&
          "border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] text-[var(--gf-amber-ink)]",
        tone === "verified" &&
          "border-[var(--gf-verbena-border)] bg-[var(--gf-verbena-soft)] text-[var(--gf-verbena-ink)]",
        tone === "persimmon" &&
          "border-[var(--gf-persimmon)]/35 bg-[var(--gf-persimmon-soft)] text-[var(--gf-persimmon-ink)]",
        className,
      )}
    >
      <p className="font-semibold">{title}</p>
      <div className="mt-1 opacity-95">{children}</div>
    </aside>
  );
}
