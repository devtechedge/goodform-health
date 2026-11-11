import React from "react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description:
    "Single-merchant Indian retail terms, integer-paise INR pricing, stock limits, and demo-mode non-commercial rules.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <Badge tone="neutral">Storefront Terms</Badge>
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Terms of Use &amp; Sale
      </h1>
      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        <p>
          <strong className="text-[var(--gf-ink)]">Single Merchant:</strong> GOODFORM ({BRAND.legalMerchantName}) operates as a single-brand consumer store, not a third-party marketplace or clinical provider.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Authoritative Server Pricing:</strong> All prices are denominated in Indian Rupees (stored in integer paise) and recomputed on the server at checkout alongside applicable CGST/SGST or IGST and shipping rules.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Personal Household Quantities:</strong> Orders are capped at 12 units per variant line and subject to atomic batch stock availability and active India FSSAI publish clearance.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Demo Mode Orders:</strong> Orders placed via Non-Charging Demo Checkout create no financial obligation, charge zero funds, and dispatch no physical goods.
        </p>
      </div>
    </div>
  );
}
