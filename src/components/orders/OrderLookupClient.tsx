"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatInrPaise } from "@/lib/india";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface LookedUpOrder {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  isDemoOrder: boolean;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  destinationCity: string;
  destinationStateCode: string;
  destinationPinCode: string;
  items: Array<{
    id: string;
    sku: string;
    productSlug: string;
    productName: string;
    variantTitle: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    lineTotalPaise: number;
  }>;
}

export function OrderLookupClient({
  initialOrderNumber = "",
}: {
  initialOrderNumber?: string;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookedUpOrder | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found.");
        return;
      }
      setResult(data.order as LookedUpOrder);
    } catch {
      setError("Network error while looking up order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="trk-order-no"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Order Number
            </label>
            <input
              id="trk-order-no"
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="GF-2026-1001"
              className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 font-mono-label text-sm uppercase"
            />
          </div>
          <div>
            <label
              htmlFor="trk-email"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Checkout Receipt Email
            </label>
            <input
              id="trk-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.in"
              className="mt-1 min-h-11 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={busy}
          data-testid="track-order-submit"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>{busy ? "Checking..." : "Check Order & Batch Status"}</span>
        </Button>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3 text-xs font-medium text-[var(--gf-persimmon-ink)]"
          >
            {error}
          </p>
        ) : null}
      </form>

      {result ? (
        <section
          data-testid="tracked-order-card"
          className="rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gf-border)] pb-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={result.isDemoOrder ? "amber" : "verbena"}>
                  {result.orderStatus}
                </Badge>
                <Badge tone="neutral">Payment: {result.paymentStatus}</Badge>
              </div>
              <h2 className="mt-2 font-display text-2xl text-[var(--gf-ink)]">
                Order {result.orderNumber}
              </h2>
              <p className="text-xs text-[var(--gf-ink-muted)]">
                Destination: {result.destinationCity} - {result.destinationPinCode} (
                {result.destinationStateCode})
              </p>
            </div>
            <p className="font-mono-label text-2xl font-semibold text-[var(--gf-ink)]">
              {formatInrPaise(result.totalPaise)}
            </p>
          </div>

          <ul className="divide-y divide-[var(--gf-border)] text-xs sm:text-sm">
            {result.items.map((item) => (
              <li
                key={item.id}
                className="py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="font-semibold text-[var(--gf-ink)] hover:text-[var(--gf-persimmon)]"
                  >
                    {item.quantity}x {item.productName}
                  </Link>
                  <p className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
                    {item.variantTitle} · Batch {item.batchNumber} · Exp{" "}
                    {item.expiryDate}
                  </p>
                </div>
                <span className="font-mono-label font-semibold">
                  {formatInrPaise(item.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
