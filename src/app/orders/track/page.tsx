import React from "react";
import type { Metadata } from "next";
import { OrderLookupClient } from "@/components/orders/OrderLookupClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Guest Order",
  description:
    "Look up your GOODFORM order status, batch numbers, and India GST invoice summary using your order number and receipt email.",
  alternates: { canonical: "/orders/track" },
  robots: { index: false, follow: false },
};

interface TrackOrderPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrackOrderPage({
  searchParams,
}: TrackOrderPageProps) {
  const sp = await searchParams;
  const rawOrder = Array.isArray(sp.order) ? sp.order[0] : sp.order;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <header className="space-y-2">
        <Badge tone="lilac">Privacy-Safe Order Lookup</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)]">
          Check Order &amp; Batch Status
        </h1>
        <p className="text-sm text-[var(--gf-ink-muted)]">
          Both your order number and matching checkout receipt email are required so order records cannot be enumerated.
        </p>
      </header>

      <OrderLookupClient initialOrderNumber={rawOrder ?? ""} />
    </div>
  );
}
