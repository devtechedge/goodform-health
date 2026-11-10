import React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55",
    size === "sm" && "min-h-9 px-3.5 py-1.5 text-xs",
    size === "md" && "min-h-10 px-5 py-2 text-sm",
    size === "lg" && "min-h-12 px-6 py-3 text-base",
    variant === "primary" &&
      "bg-[var(--gf-persimmon)] text-[var(--gf-on-persimmon)] hover:bg-[var(--gf-persimmon-hover)]",
    variant === "secondary" &&
      "bg-[var(--gf-aubergine)] text-[var(--gf-on-aubergine)] hover:bg-[var(--gf-aubergine-hover)]",
    variant === "outline" &&
      "border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]",
    variant === "ghost" &&
      "bg-transparent text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]",
    variant === "danger" &&
      "border border-[var(--gf-persimmon)] bg-[var(--gf-persimmon-soft)] text-[var(--gf-persimmon-ink)] hover:opacity-90",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
