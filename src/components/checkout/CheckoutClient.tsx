"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { computeOrderPricing } from "@/domain/pricing/totals";
import {
  formatInrPaise,
  INDIAN_STATES,
  inferStateFromPin,
} from "@/lib/india";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export interface SavedAddressItem {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  stateCode: string;
  pinCode: string;
}

export interface CheckoutClientProps {
  initialUser: { fullName: string; email: string; phone: string | null } | null;
  savedAddresses: SavedAddressItem[];
  availableProviders: Array<"razorpay" | "stripe" | "demo">;
}

interface CompletedReceipt {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalPaise: number;
  mode: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function loadRazorpaySdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  initialUser,
  savedAddresses,
  availableProviders,
}: CheckoutClientProps) {
  const { cart, refreshCart } = useCart();
  const defaultAddr = savedAddresses[0] ?? null;

  const [customerName, setCustomerName] = useState(
    defaultAddr?.recipientName ?? initialUser?.fullName ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState(initialUser?.email ?? "");
  const [phone, setPhone] = useState(
    defaultAddr?.phone ?? initialUser?.phone ?? "",
  );
  const [line1, setLine1] = useState(defaultAddr?.line1 ?? "");
  const [line2, setLine2] = useState(defaultAddr?.line2 ?? "");
  const [city, setCity] = useState(defaultAddr?.city ?? "");
  const [pinCode, setPinCode] = useState(defaultAddr?.pinCode ?? "");
  const [stateCode, setStateCode] = useState(defaultAddr?.stateCode ?? "MH");
  const [notes, setNotes] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<
    "razorpay" | "stripe" | "demo"
  >(availableProviders[0] ?? "demo");

  const [idempotencyKey] = useState(
    () =>
      `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CompletedReceipt | null>(null);

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);

  const livePricing = useMemo(() => {
    if (!cart || items.length === 0) return null;
    return computeOrderPricing(
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
        destinationStateCode: stateCode,
      },
    );
  }, [cart, items, stateCode]);

  const onPinChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPinCode(clean);
    if (clean.length === 6) {
      const inferred = inferStateFromPin(clean);
      if (inferred) setStateCode(inferred);
    }
  };

  const applySavedAddress = (addr: SavedAddressItem) => {
    setCustomerName(addr.recipientName);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setCity(addr.city);
    setPinCode(addr.pinCode);
    setStateCode(addr.stateCode);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          idempotencyKey,
          paymentProvider,
          shippingAddress: {
            recipientName: customerName,
            phone,
            line1,
            line2: line2 || undefined,
            city,
            stateCode,
            pinCode,
          },
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to place order.");
        return;
      }

      if (data.mode === "stripe" && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      if (data.mode === "razorpay" && data.razorpay) {
        await refreshCart();
        const loaded = await loadRazorpaySdk();
        if (!loaded || !window.Razorpay) {
          setError(
            `Order ${data.orderNumber} created (PENDING_PAYMENT), but Razorpay Checkout SDK could not load.`,
          );
          return;
        }
        const rzp = new window.Razorpay({
          key: data.razorpay.keyId,
          amount: data.razorpay.amountPaise,
          currency: data.razorpay.currency,
          name: "GOODFORM",
          description: `Order ${data.orderNumber}`,
          order_id: data.razorpay.providerOrderId,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: phone,
          },
          handler: async (rzpRes) => {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpay_order_id: rzpRes.razorpay_order_id,
                razorpay_payment_id: rzpRes.razorpay_payment_id,
                razorpay_signature: rzpRes.razorpay_signature,
              }),
            });
            setReceipt({
              orderId: data.orderId,
              orderNumber: data.orderNumber,
              orderStatus: verifyRes.ok ? "CONFIRMED" : data.orderStatus,
              paymentStatus: verifyRes.ok ? "CAPTURED" : data.paymentStatus,
              totalPaise: data.totalPaise,
              mode: "razorpay",
            });
          },
          modal: {
            ondismiss: () => {
              setError(
                `Payment window closed for Order ${data.orderNumber}. Status remains PENDING_PAYMENT until completed.`,
              );
            },
          },
        });
        rzp.open();
        return;
      }

      await refreshCart();
      setReceipt({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        orderStatus: data.orderStatus,
        paymentStatus: data.paymentStatus,
        totalPaise: data.totalPaise,
        mode: data.mode,
      });
    } catch {
      setError("Network error while submitting checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div
        data-testid="checkout-confirmation"
        className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-7 sm:p-10 space-y-6"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-[var(--gf-verbena-ink)]" aria-hidden="true" />
          <div>
            <Badge tone={receipt.mode === "demo" ? "amber" : "verbena"}>
              {receipt.mode === "demo"
                ? "DEMO ORDER · NON-CHARGING (UNPAID)"
                : "ORDER RECORDED"}
            </Badge>
            <h2 className="mt-1 font-display text-3xl text-[var(--gf-ink)]">
              Order {receipt.orderNumber}
            </h2>
          </div>
        </div>

        <Callout
          tone={receipt.mode === "demo" ? "caution" : "info"}
          title={
            receipt.mode === "demo"
              ? "Honest Non-Charging Demo Confirmation"
              : "Payment Gateway Handshake"
          }
        >
          {receipt.mode === "demo" ? (
            <>
              No payment gateway charge occurred. Order status is{" "}
              <strong className="font-mono-label">{receipt.orderStatus}</strong>{" "}
              and payment status is{" "}
              <strong className="font-mono-label">
                {receipt.paymentStatus}
              </strong>{" "}
              (never marked Paid). Batch inventory reservation and email sink receipt were written to PostgreSQL.
            </>
          ) : (
            <>
              Order created with status{" "}
              <strong className="font-mono-label">{receipt.orderStatus}</strong>{" "}
              and payment status{" "}
              <strong className="font-mono-label">
                {receipt.paymentStatus}
              </strong>
              .
            </>
          )}
        </Callout>

        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--gf-bg)] p-4 text-xs">
          <div>
            <dt className="text-[var(--gf-ink-muted)]">Order Total (INR)</dt>
            <dd className="mt-0.5 font-mono-label text-base font-semibold">
              {formatInrPaise(receipt.totalPaise)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--gf-ink-muted)]">Payment Status</dt>
            <dd
              data-testid="confirmation-payment-status"
              className="mt-0.5 font-mono-label text-sm font-semibold"
            >
              {receipt.paymentStatus}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          {initialUser ? (
            <Link
              href={`/account/orders/${receipt.orderId}`}
              className={buttonClasses({ variant: "primary" })}
            >
              Inspect Order Details
            </Link>
          ) : (
            <Link
              href={`/orders/track?order=${encodeURIComponent(receipt.orderNumber)}`}
              className={buttonClasses({ variant: "primary" })}
            >
              Track Order Status
            </Link>
          )}
          <Link href="/shop" className={buttonClasses({ variant: "outline" })}>
            Continue Browsing
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-10 text-center space-y-4">
        <p className="font-display text-2xl">Your bag is empty</p>
        <Link href="/shop" className={buttonClasses({ variant: "primary" })}>
          Browse Formulations
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7 space-y-6 min-w-0">
        {savedAddresses.length > 0 ? (
          <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 space-y-3">
            <h2 className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
              Saved Indian Delivery Addresses
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => applySavedAddress(addr)}
                  className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3 text-left text-xs hover:border-[var(--gf-persimmon)]"
                >
                  <p className="font-semibold text-[var(--gf-ink)]">
                    {addr.label} · {addr.recipientName}
                  </p>
                  <p className="mt-0.5 text-[var(--gf-ink-muted)] truncate">
                    {addr.line1}, {addr.city} {addr.pinCode} ({addr.stateCode})
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Delivery Address (India)
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="chk-name"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                Recipient Full Name
              </label>
              <input
                id="chk-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="chk-email"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                Email for Receipt
              </label>
              <input
                id="chk-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="chk-phone"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                Indian Mobile (+91 / 10-digit)
              </label>
              <input
                id="chk-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9820144110"
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="chk-pin"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                6-Digit PIN Code
              </label>
              <input
                id="chk-pin"
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={pinCode}
                onChange={(e) => onPinChange(e.target.value)}
                placeholder="400050"
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 font-mono-label text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="chk-line1"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Flat / Building / Street Address
            </label>
            <input
              id="chk-line1"
              type="text"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="chk-city"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                City / Town
              </label>
              <input
                id="chk-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="chk-state"
                className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
              >
                State / Union Territory
              </label>
              <select
                id="chk-state"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="chk-notes"
              className="block font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]"
            >
              Delivery Instructions (Optional)
            </label>
            <input
              id="chk-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave with building security desk"
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Payment Method (Zero Card Data Stored)
          </h2>

          <div className="space-y-2.5">
            {availableProviders.includes("razorpay") ? (
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 cursor-pointer">
                <input
                  type="radio"
                  name="paymentProvider"
                  value="razorpay"
                  checked={paymentProvider === "razorpay"}
                  onChange={() => setPaymentProvider("razorpay")}
                  className="mt-1 accent-[var(--gf-persimmon)]"
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    Razorpay India (UPI, Cards, Netbanking)
                  </p>
                  <p className="text-xs text-[var(--gf-ink-muted)]">
                    Official Razorpay INR order creation + HMAC-SHA256 verification.
                  </p>
                </div>
              </label>
            ) : null}

            {availableProviders.includes("stripe") ? (
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3.5 cursor-pointer">
                <input
                  type="radio"
                  name="paymentProvider"
                  value="stripe"
                  checked={paymentProvider === "stripe"}
                  onChange={() => setPaymentProvider("stripe")}
                  className="mt-1 accent-[var(--gf-persimmon)]"
                />
                <div className="text-sm">
                  <p className="font-semibold">Stripe INR Hosted Checkout</p>
                  <p className="text-xs text-[var(--gf-ink-muted)]">
                    Redirects to official Stripe Checkout Session in INR.
                  </p>
                </div>
              </label>
            ) : null}

            {availableProviders.includes("demo") ? (
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] p-3.5 text-[var(--gf-amber-ink)] cursor-pointer">
                <input
                  type="radio"
                  name="paymentProvider"
                  value="demo"
                  checked={paymentProvider === "demo"}
                  onChange={() => setPaymentProvider("demo")}
                  className="mt-1 accent-[var(--gf-persimmon)]"
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    Non-Charging Demo Checkout (INR 0 Charged)
                  </p>
                  <p className="text-xs opacity-95">
                    Records a persistent PostgreSQL order with status{" "}
                    <code className="font-mono-label">DEMO_ORDER</code> and payment status{" "}
                    <code className="font-mono-label">DEMO_NON_CHARGING</code>{" "}
                    (never marked Paid). No card or UPI details collected.
                  </p>
                </div>
              </label>
            ) : null}
          </div>
        </section>
      </div>

      {/* Summary Column */}
      <div className="lg:col-span-5 space-y-4 min-w-0">
        <div className="rounded-3xl border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Order Summary ({cart?.totalItemCount ?? 0})
          </h2>

          <ul className="divide-y divide-[var(--gf-border)] text-xs">
            {items.map((item) => (
              <li
                key={item.itemId}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <span className="min-w-0 truncate">
                  <strong>{item.quantity}x</strong> {item.productName} ({item.variantTitle})
                </span>
                <span className="font-mono-label font-semibold shrink-0">
                  {formatInrPaise(item.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>

          {livePricing ? (
            <dl className="space-y-2 border-t border-[var(--gf-border)] pt-4 text-sm">
              <div className="flex justify-between text-[var(--gf-ink-muted)]">
                <dt>Subtotal</dt>
                <dd className="font-mono-label">
                  {formatInrPaise(livePricing.subtotalPaise)}
                </dd>
              </div>
              {livePricing.discountPaise > 0 ? (
                <div className="flex justify-between text-[var(--gf-verbena-ink)]">
                  <dt>Coupon ({cart?.appliedCouponCode})</dt>
                  <dd className="font-mono-label">
                    -{formatInrPaise(livePricing.discountPaise)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between text-[var(--gf-ink-muted)]">
                <dt>Shipping ({stateCode})</dt>
                <dd className="font-mono-label">
                  {livePricing.shippingPaise === 0
                    ? "FREE"
                    : formatInrPaise(livePricing.shippingPaise)}
                </dd>
              </div>
              <div className="rounded-xl bg-[var(--gf-bg)] p-3 text-xs space-y-1 text-[var(--gf-ink-muted)]">
                <div className="flex justify-between">
                  <span>Taxable Value</span>
                  <span className="font-mono-label">
                    {formatInrPaise(livePricing.taxablePaise, {
                      alwaysShowPaise: true,
                    })}
                  </span>
                </div>
                {livePricing.isIntraState ? (
                  <>
                    <div className="flex justify-between">
                      <span>CGST (9% MH)</span>
                      <span className="font-mono-label">
                        {formatInrPaise(livePricing.cgstPaise, {
                          alwaysShowPaise: true,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (9% MH)</span>
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
              <div className="flex justify-between border-t border-[var(--gf-border)] pt-3 text-lg font-semibold">
                <dt>Total</dt>
                <dd className="font-mono-label">
                  {formatInrPaise(livePricing.totalPaise)}
                </dd>
              </div>
            </dl>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[var(--gf-persimmon)]/40 bg-[var(--gf-persimmon-soft)] p-3 text-xs font-medium text-[var(--gf-persimmon-ink)]"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            data-testid="place-order-button"
            className="w-full"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>
              {submitting
                ? "Recording Order..."
                : paymentProvider === "demo"
                  ? "Place Non-Charging Demo Order"
                  : `Pay ${livePricing ? formatInrPaise(livePricing.totalPaise) : ""}`}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
