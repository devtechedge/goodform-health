"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import type { HydratedVariant } from "@/domain/catalog/service";
import { formatInrPaise } from "@/lib/india";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartContext";

export interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  variants: HydratedVariant[];
}

export function ProductPurchasePanel({
  productId,
  productName,
  variants,
}: ProductPurchasePanelProps) {
  const { addToCart, isBusy } = useCart();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [wishSaved, setWishSaved] = useState(false);
  const [wishNote, setWishNote] = useState<string | null>(null);

  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0] ?? null;

  if (!selected) {
    return null;
  }

  const perServingPaise = Math.round(
    selected.pricePaise / Math.max(1, selected.servingsCount),
  );
  const outOfStock = selected.availableStock <= 0;

  const toggleWishlist = async () => {
    setWishNote(null);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      setWishNote("Sign in required to save to wishlist.");
      return;
    }
    if (res.ok) {
      const data = (await res.json()) as { saved: boolean };
      setWishSaved(data.saved);
      setWishNote(data.saved ? "Saved to your wishlist." : "Removed from wishlist.");
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-5 sm:p-6">
      {variants.length > 1 ? (
        <div>
          <p className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
            Select Pack Variant
          </p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {variants.map((v) => {
              const active = v.id === selected.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  aria-pressed={active}
                  className={`rounded-2xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-[var(--gf-persimmon)] bg-[var(--gf-persimmon-soft)]/55"
                      : "border-[var(--gf-border)] bg-[var(--gf-bg)] hover:border-[var(--gf-border-strong)]"
                  }`}
                >
                  <p className="font-semibold text-sm text-[var(--gf-ink)]">
                    {v.title}
                  </p>
                  <p className="mt-1 font-mono-label text-xs text-[var(--gf-ink-muted)]">
                    {formatInrPaise(v.pricePaise)} ·{" "}
                    {formatInrPaise(
                      Math.round(v.pricePaise / Math.max(1, v.servingsCount)),
                    )}
                    /serving
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--gf-border)] pb-4">
        <div>
          <p
            data-testid="pdp-price"
            className="font-mono-label text-3xl font-semibold text-[var(--gf-ink)]"
          >
            {formatInrPaise(selected.pricePaise)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--gf-ink-muted)]">
            MRP inclusive of {selected.gstRateBps / 100}% GST ·{" "}
            {formatInrPaise(perServingPaise)} per serving
          </p>
        </div>
        <div className="text-right font-mono-label text-xs text-[var(--gf-ink-muted)]">
          <p>
            Stock:{" "}
            <strong className="text-[var(--gf-ink)]">
              {selected.availableStock > 0
                ? `${selected.availableStock} units`
                : "Sold out"}
            </strong>
          </p>
          <p>Batch: {selected.batchNumber} (Demo)</p>
          <p>Best before: {selected.expiryDate}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          aria-label="Quantity selector"
          className="inline-flex items-center rounded-full border border-[var(--gf-border-strong)] bg-[var(--gf-bg)] p-1"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--gf-surface-muted)]"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-9 text-center font-mono-label text-sm font-semibold">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() =>
              setQty((q) => Math.min(12, selected.availableStock, q + 1))
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--gf-surface-muted)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={outOfStock || isBusy}
          data-testid="pdp-add-to-bag"
          onClick={() => void addToCart(selected.id, qty)}
          className="flex-1 min-w-[180px]"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <span>
            {outOfStock ? "Out of Stock" : `Add to Bag · ${formatInrPaise(selected.pricePaise * qty)}`}
          </span>
        </Button>

        <button
          type="button"
          onClick={() => void toggleWishlist()}
          aria-label={
            wishSaved
              ? `Remove ${productName} from wishlist`
              : `Save ${productName} to wishlist`
          }
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gf-border-strong)] bg-[var(--gf-bg)] hover:bg-[var(--gf-surface-muted)]"
        >
          <Heart
            className={`h-5 w-5 ${
              wishSaved ? "fill-[var(--gf-persimmon)] text-[var(--gf-persimmon)]" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {wishNote ? (
        <p className="text-xs text-[var(--gf-ink-muted)]">
          {wishNote}{" "}
          {wishNote.includes("Sign in") ? (
            <Link href="/login" className="font-semibold text-[var(--gf-persimmon-ink)] underline">
              Sign in
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
