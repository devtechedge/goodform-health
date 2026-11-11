import React from "react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Pan-India Shipping & GST",
  description:
    "Dispatch timelines, 6-digit Indian PIN code coverage, heat-safe probiotic/softgel packing, and CGST/SGST vs IGST tax rules.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <Badge tone="lilac">Dispatch &amp; Tax Policy</Badge>
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Pan-India Shipping &amp; GST
      </h1>
      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        <p>
          <strong className="text-[var(--gf-ink)]">Origin Hub:</strong> Orders dispatch from {BRAND.dispatchCity}, {BRAND.dispatchStateName} ({BRAND.dispatchStateCode}). Note: In Demo Mode, orders are recorded in PostgreSQL for workflow verification and no physical courier shipment is booked.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Shipping Rates:</strong> Orders of INR 999 and above (after coupon discount) qualify for free standard shipping across serviceable 6-digit Indian PIN codes. Orders below INR 999 carry a flat INR 79 shipping fee.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Indian GST Breakdown:</strong> Retail prices are MRP inclusive of applicable GST (18% standard rate on Health Supplements and Nutraceuticals). Deliveries within Maharashtra split tax equally into CGST (9%) + SGST (9%); deliveries to all other 35 Indian States and Union Territories record IGST (18%).
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">Ambient &amp; Monsoon Protection:</strong> Softgels, probiotics, and hygroscopic powders include food-grade silica desiccants and induction-sealed liners suited for warm Indian transit conditions.
        </p>
      </div>
    </div>
  );
}
