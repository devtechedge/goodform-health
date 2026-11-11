"use client";

import React from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono-label text-xs uppercase tracking-[0.18em] text-[var(--gf-persimmon-ink)]">
        Unexpected Storefront Error
      </p>
      <h1 className="mt-2 font-display text-3xl text-[var(--gf-ink)]">
        Something interrupted this view
      </h1>
      <p className="mt-2 text-sm text-[var(--gf-ink-muted)]">
        Try refreshing the view or returning to the main dispensary.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="primary">
          Try Again
        </Button>
        <Link href="/" className={buttonClasses({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
