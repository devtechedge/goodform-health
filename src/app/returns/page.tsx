import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Returns & Batch Guarantee",
  description:
    "Self-serve return requests for damaged, tampered, or incorrect supplement deliveries on GOODFORM.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <Badge tone="persimmon">Returns &amp; Hygiene Rules</Badge>
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Returns, Replacements &amp; Refunds
      </h1>
      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        <p>
          <strong className="text-[var(--gf-ink)]">14-Day Sealed Return Window:</strong> Unopened jars with intact induction seals, or deliveries arriving damaged, leaked, or with an incorrect batch, may be submitted for return or replacement within 14 days of delivery.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Ingestible Safety Rule:</strong> Because supplements are ingestible food products, opened jars with broken neck seals cannot be restocked, and any quality concern on an opened batch is routed directly to our Quality Desk with the printed Batch Number.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Self-Serve Account Flow:</strong> Signed-in customers can open a return request directly from any eligible order in their account dashboard. Demo orders never trigger card charges and keep payment status <code className="font-mono-label">DEMO_NON_CHARGING</code>.
        </p>
        <div className="pt-2">
          <Link href="/account" className={buttonClasses({ variant: "primary" })}>
            Manage Orders &amp; Returns
          </Link>
        </div>
      </div>
    </div>
  );
}
