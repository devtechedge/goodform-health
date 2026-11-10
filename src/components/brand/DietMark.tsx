import React from "react";
import clsx from "clsx";

export type DietType = "VEGAN" | "VEGETARIAN" | "NON_VEGETARIAN";

export interface DietMarkProps {
  dietType: DietType;
  showLabel?: boolean;
  className?: string;
}

/**
 * Indian FSSAI Food Safety and Standards (Labelling and Display) Regulations symbol:
 * - Vegetarian / Vegan: Green filled circle inside a green square outline.
 * - Non-Vegetarian (e.g. marine fish oil, marine/bovine collagen): Brown filled triangle inside a brown square outline.
 * Note: "Vegan" is displayed only as a descriptive ingredient-origin flag on demo seeds and never implies FSSAI Vegan Logo certification unless owner-verified.
 */
export function DietMark({
  dietType,
  showLabel = true,
  className,
}: DietMarkProps) {
  const isNonVeg = dietType === "NON_VEGETARIAN";
  const label =
    dietType === "VEGAN"
      ? "Vegetarian mark · Plant-origin formula"
      : dietType === "VEGETARIAN"
        ? "Vegetarian"
        : "Non-Vegetarian (animal/marine origin)";

  const strokeColor = isNonVeg ? "#7A3B1E" : "#1D6A3B";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gf-ink-muted)]",
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        role="img"
        aria-label={label}
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="1.5"
          fill="#FFFDF9"
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        {isNonVeg ? (
          <polygon points="8,3.6 12.4,11.8 3.6,11.8" fill={strokeColor} />
        ) : (
          <circle cx="8" cy="8" r="4" fill={strokeColor} />
        )}
      </svg>
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}
