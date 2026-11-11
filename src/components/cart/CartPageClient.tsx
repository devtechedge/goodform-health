"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Tag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { formatInrPaise, INDIAN_STATES } from "@/lib/india";
import { computeOrderPricing } from "@/domain/pricing/totals";
import { Button, buttonClasses } from "@/components/ui/Button";

export function CartPageClient() {
  const { cart, isBusy, error, setLineQuantity, applyCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [previewState, setPreviewState] = useState("MH");

  const items = cart?.items ?? [];

  const livePricing =
    cart && items.length > 0
      ? computeOrderPricing(
          items.map((l) => ({
            variantId: l.variantId,
            unitPricePaise: l.unitPricePaise,
            quantity: l.quantity,
            gstRateBps: l.gstRateBps,
          })),
          cart.pricing.discountPaise,
          {
            freeShippingThresholdPaise: 99900,
            standardShippingPaise: 7900,
            dispatchStateCode: "MH",
            destinationStateCode: previewState,
          },
        )
      : null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = await applyCoupon(couponInput.trim());
    if (ok) setCouponInput("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Your Apothecary Bag
      </h1>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3.5 text-sm text-[var(--gf-persimmon-ink)]"
        >
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-12 text-center space-y-4">
          <p className="font-display text-2xl text-[var(--gf-ink)]">
            Nothing in your bag yet
          </p>
          <p className="text-sm text-[var(--gf-ink-muted)]">
            Add single-nutrient formulations or generate a balanced stack in the Routine Builder.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/shop" className={buttonClasses({ variant: "primary" })}>
              Shop All Formulations
            </Link>
            <Link
              href="/routine-builder"
              className={buttonClasses({ variant: "outline" })}
            >
              Open Routine Builder
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {items.map((item) => (
              <div
                key={item.itemId}
                className="flex flex-col gap-4 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imagePath}
                  alt={item.productName}
                  width={92}
                  height={95}
                  className="h-24 w-23 shrink-0 rounded-2xl border border-[var(--gf-border)] object-cover"
                />

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="font-display text-xl text-[var(--gf-ink)] hover:text-[var(--gf-persimmon)]"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-xs text-[var(--gf-ink-muted)]">
                    {item.variantTitle} · Batch {item.batchNumber}
                  </p>
                  <p className="mt-1 font-mono-label text-sm font-semibold">
                    {formatInrPaise(item.unitPricePaise)} each
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="inline-flex items-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] p-1">
                    <button
                      type="button"
                      disabled={isBusy}
                      aria-label={`Decrease quantity of ${item.productName}`}
                      onClick={() =>
                        void setLineQuantity(item.variantId, item.quantity - 1)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--gf-surface-muted)]"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-mono-label text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isBusy || item.quantity >= item.availableStock}
                      aria-label={`Increase quantity of ${item.productName}`}
                      onClick={() =>
                        void setLineQuantity(item.variantId, item.quantity + 1)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--gf-surface-muted)]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="font-mono-label text-sm font-semibold min-w-[82px] text-right">
                    {formatInrPaise(item.lineTotalPaise)}
                  </p>

                  <button
                    type="button"
                    disabled={isBusy}
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => void setLineQuantity(item.variantId, 0)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--gf-ink-muted)] hover:bg-[var(--gf-surface-muted)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 space-y-4 min-w-0">
            <div className="rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-6 space-y-5">
              <h2 className="font-display text-2xl text-[var(--gf-ink)]">
                Order &amp; India GST Summary
              </h2>

              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label
                  htmlFor="cart-coupon-input"
                  className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
                >
                  Promo / Routine Code (e.g. WELCOME10, ROUTINE250)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="WELCOME10"
                    className="min-h-10 flex-1 min-w-0 rounded-full border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3.5 font-mono-label text-xs uppercase"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                  >
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Apply</span>
                  </Button>
                </div>
                {cart?.appliedCouponCode ? (
                  <div className="flex items-center justify-between rounded-xl bg-[var(--gf-verbena-soft)] px-3 py-2 text-xs text-[var(--gf-verbena-ink)]">
                    <span>
                      Active: <strong>{cart.appliedCouponCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => void applyCoupon(null)}
                      className="font-semibold underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </form>

              <div>
                <label
                  htmlFor="cart-gst-state"
                  className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
                >
                  Preview Delivery State (Dispatch: Maharashtra MH)
                </label>
                <select
                  id="cart-gst-state"
                  value={previewState}
                  onChange={(e) => setPreviewState(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {livePricing ? (
                <dl className="space-y-2 border-t border-[var(--gf-border)] pt-4 text-sm">
                  <div className="flex justify-between text-[var(--gf-ink-muted)]">
                    <dt>Merchandise Subtotal (MRP)</dt>
                    <dd className="font-mono-label">
                      {formatInrPaise(livePricing.subtotalPaise)}
                    </dd>
                  </div>
                  {livePricing.discountPaise > 0 ? (
                    <div className="flex justify-between text-[var(--gf-verbena-ink)]">
                      <dt>Discount ({cart?.appliedCouponCode})</dt>
                      <dd className="font-mono-label">
                        -{formatInrPaise(livePricing.discountPaise)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-[var(--gf-ink-muted)]">
                    <dt>Pan-India Shipping</dt>
                    <dd className="font-mono-label">
                      {livePricing.shippingPaise === 0
                        ? "FREE"
                        : formatInrPaise(livePricing.shippingPaise)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[var(--gf-bg)] p-3 text-xs space-y-1 text-[var(--gf-ink-muted)]">
                    <div className="flex justify-between">
                      <span>Taxable Value (Excl. GST)</span>
                      <span className="font-mono-label">
                        {formatInrPaise(livePricing.taxablePaise, {
                          alwaysShowPaise: true,
                        })}
                      </span>
                    </div>
                    {livePricing.isIntraState ? (
                      <>
                        <div className="flex justify-between">
                          <span>CGST (9% Intra-State MH)</span>
                          <span className="font-mono-label">
                            {formatInrPaise(livePricing.cgstPaise, {
                              alwaysShowPaise: true,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST (9% Intra-State MH)</span>
                          <span className="font-mono-label">
                            {formatInrPaise(livePricing.sgstPaise, {
                              alwaysShowPaise: true,
                            })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>IGST (18% Inter-State)</span>
                        <span className="font-mono-label">
                          {formatInrPaise(livePricing.igstPaise, {
                            alwaysShowPaise: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-[var(--gf-border)] pt-3 text-base font-semibold">
                    <dt>Total Payable</dt>
                    <dd className="font-mono-label">
                      {formatInrPaise(livePricing.totalPaise)}
                    </dd>
                  </div>
                </dl>
              ) : null}

              <Link
                href="/checkout"
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  className: "w-full",
                })}
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
