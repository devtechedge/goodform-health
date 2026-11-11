import React from "react";
import clsx from "clsx";

export interface PackshotVisualProps {
  imagePath: string;
  productName: string;
  isDemoSeed?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * Renders a local concept packshot SVG with explicit aspect-ratio preservation
 * (zero CLS) and an accessible label noting concept-pack demo status.
 */
export function PackshotVisual({
  imagePath,
  productName,
  isDemoSeed = true,
  priority = false,
  className,
}: PackshotVisualProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface-muted)] aspect-[30/31]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePath}
        alt={`${productName}${isDemoSeed ? " (Concept packshot - demo only)" : ""}`}
        width={600}
        height={620}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
      />
    </div>
  );
}
