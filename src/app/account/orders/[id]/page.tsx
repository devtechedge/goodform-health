import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { returnRequests } from "@/db/schema/commerce";
import { requirePageUser } from "@/domain/auth/rbac";
import { getUserOrderDetail, OrderDomainError } from "@/domain/orders/service";
import { formatInrPaise } from "@/lib/india";
import {
  ReorderButton,
  ReturnRequestForm,
} from "@/components/account/AccountActionsClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await requirePageUser("/account");
  const { id } = await params;

  const db = await getDb();
  let detail;
  try {
    detail = await getUserOrderDetail(user.id, id, db);
  } catch (err) {
    if (err instanceof OrderDomainError) {
      notFound();
    }
    throw err;
  }

  const { order, items } = detail;
  const existingReturns = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.orderId, order.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <Link
        href="/account"
        className="font-mono-label text-xs text-[var(--gf-persimmon-ink)] hover:underline"
      >
        &larr; Back to Account
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--gf-border)] pb-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={order.isDemoOrder ? "amber" : "verbena"}>
              {order.orderStatus}
            </Badge>
            <Badge tone="neutral">Payment: {order.paymentStatus}</Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
            Order {order.orderNumber}
          </h1>
          <p className="text-xs text-[var(--gf-ink-muted)]">
            {order.isDemoOrder
              ? "Non-charging demo order (INR 0 charged; never marked Paid)."
              : `Provider: ${order.paymentProvider}`}
          </p>
        </div>

        <ReorderButton orderId={order.id} />
      </header>

      {/* Immutable Line Snapshots */}
      <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
        <h2 className="font-display text-2xl text-[var(--gf-ink)]">
          Formulation Line Snapshots
        </h2>
        <div className="divide-y divide-[var(--gf-border)]">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-sm text-[var(--gf-ink)]">
                  {item.quantity}x {item.productName} · {item.variantTitle}
                </p>
                <p className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
                  SKU {item.sku} · Batch {item.batchNumber} · Exp {item.expiryDate}
                </p>
                <p className="text-xs text-[var(--gf-ink-muted)]">
                  {item.ingredientSnapshot}
                </p>
              </div>
              <p className="font-mono-label text-sm font-semibold shrink-0">
                {formatInrPaise(item.lineTotalPaise)}
              </p>
            </div>
          ))}
        </div>

        <dl className="border-t border-[var(--gf-border)] pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-[var(--gf-ink-muted)]">
            <dt>Subtotal</dt>
            <dd className="font-mono-label">{formatInrPaise(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 ? (
            <div className="flex justify-between text-[var(--gf-verbena-ink)]">
              <dt>Discount ({order.couponCode})</dt>
              <dd className="font-mono-label">-{formatInrPaise(order.discountPaise)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-[var(--gf-ink-muted)]">
            <dt>Shipping</dt>
            <dd className="font-mono-label">
              {order.shippingPaise === 0 ? "FREE" : formatInrPaise(order.shippingPaise)}
            </dd>
          </div>
          <div className="flex justify-between text-xs text-[var(--gf-ink-muted)]">
            <dt>Taxable Value</dt>
            <dd className="font-mono-label">
              {formatInrPaise(order.taxablePaise, { alwaysShowPaise: true })}
            </dd>
          </div>
          {order.igstPaise > 0 ? (
            <div className="flex justify-between text-xs text-[var(--gf-ink-muted)]">
              <dt>IGST (Inter-State)</dt>
              <dd className="font-mono-label">
                {formatInrPaise(order.igstPaise, { alwaysShowPaise: true })}
              </dd>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-[var(--gf-ink-muted)]">
                <dt>CGST (Intra-State)</dt>
                <dd className="font-mono-label">
                  {formatInrPaise(order.cgstPaise, { alwaysShowPaise: true })}
                </dd>
              </div>
              <div className="flex justify-between text-xs text-[var(--gf-ink-muted)]">
                <dt>SGST (Intra-State)</dt>
                <dd className="font-mono-label">
                  {formatInrPaise(order.sgstPaise, { alwaysShowPaise: true })}
                </dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-[var(--gf-border)] pt-2 font-semibold text-base">
            <dt>Order Total</dt>
            <dd className="font-mono-label">{formatInrPaise(order.totalPaise)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-2 text-xs text-[var(--gf-ink-muted)]">
          <h2 className="font-display text-xl text-[var(--gf-ink)]">
            Shipping Destination
          </h2>
          <p className="font-semibold text-sm text-[var(--gf-ink)]">
            {order.shippingAddressJson.recipientName}
          </p>
          <p>{order.shippingAddressJson.line1}</p>
          {order.shippingAddressJson.line2 ? (
            <p>{order.shippingAddressJson.line2}</p>
          ) : null}
          <p>
            {order.shippingAddressJson.city} - {order.shippingAddressJson.pinCode},{" "}
            {order.shippingAddressJson.stateName} ({order.shippingAddressJson.stateCode})
          </p>
          <p className="font-mono-label">{order.shippingAddressJson.phone}</p>
        </section>

        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-3">
          <h2 className="font-display text-xl text-[var(--gf-ink)]">
            Returns &amp; Replacements
          </h2>
          {existingReturns.length > 0 ? (
            <div className="space-y-2 text-xs">
              {existingReturns.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-3"
                >
                  <Badge tone="amber">{r.status}</Badge>
                  <p className="mt-1 font-semibold">{r.reason}</p>
                  <p className="text-[var(--gf-ink-muted)]">{r.details}</p>
                  {r.adminNotes ? (
                    <p className="mt-1 font-mono-label text-[var(--gf-ink)]">
                      Resolution: {r.adminNotes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <ReturnRequestForm orderId={order.id} />
          )}
        </section>
      </div>
    </div>
  );
}
