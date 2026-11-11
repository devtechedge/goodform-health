"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { HydratedCartView } from "@/domain/cart/service";
import { formatInrPaise } from "@/lib/india";
import { buttonClasses } from "@/components/ui/Button";

interface CartContextValue {
  cart: HydratedCartView | null;
  isOpen: boolean;
  isBusy: boolean;
  error: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  addBatchToCart: (
    items: Array<{ variantId: string; quantity: number }>,
  ) => Promise<boolean>;
  setLineQuantity: (variantId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string | null) => Promise<boolean>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<HydratedCartView | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as HydratedCartView;
        setCart(data);
      }
    } catch {
      // Ignore transient network errors on initial hydration.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<HydratedCartView>) : null))
      .then((data) => {
        if (!cancelled && data) {
          setCart(data);
        }
      })
      .catch(() => {
        // Ignore transient hydration network errors.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const addToCart = useCallback(async (variantId: string, quantity = 1) => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity, mode: "increment" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add item.");
        setIsOpen(true);
        return false;
      }
      setCart(data as HydratedCartView);
      setIsOpen(true);
      return true;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const addBatchToCart = useCallback(
    async (items: Array<{ variantId: string; quantity: number }>) => {
      setIsBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not add routine items.");
          setIsOpen(true);
          return false;
        }
        setCart(data as HydratedCartView);
        setIsOpen(true);
        return true;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const setLineQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      setIsBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity, mode: "set" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not update quantity.");
          return;
        }
        setCart(data as HydratedCartView);
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const applyCoupon = useCallback(async (code: string | null) => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid coupon code.");
        return false;
      }
      setCart(data as HydratedCartView);
      return true;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const count = cart?.totalItemCount ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isBusy,
        error,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
        refreshCart,
        addToCart,
        addBatchToCart,
        setLineQuantity,
        applyCoupon,
      }}
    >
      {children}

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label="Your apothecary bag"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="flex h-full w-full max-w-md flex-col border-l border-[var(--gf-border)] bg-[var(--gf-surface)] text-[var(--gf-ink)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--gf-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[var(--gf-persimmon)]" aria-hidden="true" />
                <h2 className="font-display text-xl">
                  Your Bag ({count})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close bag drawer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gf-border)] hover:bg-[var(--gf-surface-muted)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {error ? (
              <div
                role="alert"
                className="mx-5 mt-3 rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--gf-persimmon-ink)]"
              >
                {error}
              </div>
            ) : null}

            {cart && cart.items.length > 0 ? (
              <>
                <div className="border-b border-[var(--gf-border)] bg-[var(--gf-surface-muted)] px-5 py-2.5 text-xs text-[var(--gf-ink-muted)]">
                  {cart.pricing.freeShippingRemainingPaise === 0 ? (
                    <span className="font-medium text-[var(--gf-verbena-ink)]">
                      Unlocked free pan-India shipping.
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <strong>
                        {formatInrPaise(cart.pricing.freeShippingRemainingPaise)}
                      </strong>{" "}
                      more for free pan-India shipping.
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex gap-3.5 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imagePath}
                        alt={item.productName}
                        width={68}
                        height={70}
                        className="h-18 w-17 shrink-0 rounded-xl border border-[var(--gf-border)] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.productSlug}`}
                          onClick={() => setIsOpen(false)}
                          className="block truncate font-semibold text-sm hover:text-[var(--gf-persimmon)]"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-[var(--gf-ink-muted)] truncate">
                          {item.variantTitle}
                        </p>
                        <p className="mt-1 font-mono-label text-xs font-semibold">
                          {formatInrPaise(item.lineTotalPaise)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            aria-label={`Decrease quantity of ${item.productName}`}
                            onClick={() =>
                              void setLineQuantity(
                                item.variantId,
                                item.quantity - 1,
                              )
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)]"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="font-mono-label text-xs w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy || item.quantity >= item.availableStock}
                            aria-label={`Increase quantity of ${item.productName}`}
                            onClick={() =>
                              void setLineQuantity(
                                item.variantId,
                                item.quantity + 1,
                              )
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gf-border)] bg-[var(--gf-surface)]"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            aria-label={`Remove ${item.productName} from bag`}
                            onClick={() =>
                              void setLineQuantity(item.variantId, 0)
                            }
                            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--gf-ink-muted)] hover:bg-[var(--gf-surface-muted)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-[var(--gf-ink-muted)]">
                      <span>Subtotal (MRP incl. GST)</span>
                      <span className="font-mono-label">
                        {formatInrPaise(cart.pricing.subtotalPaise)}
                      </span>
                    </div>
                    {cart.pricing.discountPaise > 0 ? (
                      <div className="flex justify-between text-[var(--gf-verbena-ink)]">
                        <span>Coupon ({cart.appliedCouponCode})</span>
                        <span className="font-mono-label">
                          -{formatInrPaise(cart.pricing.discountPaise)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[var(--gf-ink-muted)]">
                      <span>Shipping</span>
                      <span className="font-mono-label">
                        {cart.pricing.shippingPaise === 0
                          ? "FREE"
                          : formatInrPaise(cart.pricing.shippingPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--gf-border)] pt-2 font-semibold text-base">
                      <span>Estimated Total</span>
                      <span className="font-mono-label">
                        {formatInrPaise(cart.pricing.totalPaise)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href="/cart"
                      onClick={() => setIsOpen(false)}
                      className={buttonClasses({ variant: "outline", size: "md" })}
                    >
                      View Bag
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      data-testid="drawer-checkout-link"
                      className={buttonClasses({ variant: "primary", size: "md" })}
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="font-display text-2xl">Your bag is empty</p>
                <p className="mt-2 text-sm text-[var(--gf-ink-muted)]">
                  Explore single-ingredient minerals, essential lipids, or build a custom stack with overlap checks.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/shop"
                    onClick={() => setIsOpen(false)}
                    className={buttonClasses({ variant: "primary" })}
                  >
                    Browse All 32 Formulations
                  </Link>
                  <Link
                    href="/routine-builder"
                    onClick={() => setIsOpen(false)}
                    className={buttonClasses({ variant: "outline" })}
                  >
                    Routine Builder
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </CartContext.Provider>
  );
}
