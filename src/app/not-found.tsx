import React from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono-label text-xs uppercase tracking-[0.18em] text-[var(--gf-persimmon-ink)]">
        404 · Shelf Or Formulation Not Published
      </p>
      <h1 className="mt-3 font-display text-4xl text-[var(--gf-ink)]">
        This page or formulation is not on the public shelf
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        If you followed a link to a pending botanical, AYUSH-borderline, or non-specified formulation (such as Shilajit or NAC), our India FSSAI publishing gate withholds it from public retail until regulatory clearance is verified.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClasses({ variant: "primary" })}>
          Browse Published Formulations
        </Link>
        <Link href="/quality" className={buttonClasses({ variant: "outline" })}>
          Read FSSAI Gate Policy
        </Link>
      </div>
    </div>
  );
}
