import React from "react";
import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, returnRequests } from "@/db/schema/commerce";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { formatInrPaise } from "@/lib/india";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  OrderTransitionControl,
  ReturnResolutionControl,
} from "@/components/admin/AdminOpsClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Orders & Returns",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const actor = await requireAdminPageUser("admin:access");
  const db = await getDb();

  const [allOrders, allReturns] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(returnRequests).orderBy(desc(returnRequests.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <AdminNav actor={actor} currentPath="/admin/orders" />

      <section className="space-y-4">
        <h1 className="font-display text-3xl text-[var(--gf-ink)]">
          Orders &amp; Fulfilment ({allOrders.length})
        </h1>
        <div className="space-y-3">
          {allOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-col justify-between gap-3 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 lg:flex-row lg:items-center"
            >
              <div className="space-y-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-label text-sm font-bold text-[var(--gf-ink)]">
                    {o.orderNumber}
                  </span>
                  <Badge tone={o.isDemoOrder ? "amber" : "verbena"}>
                    {o.orderStatus}
                  </Badge>
                  <Badge tone="neutral">Payment: {o.paymentStatus}</Badge>
                </div>
                <p className="text-[var(--gf-ink-muted)]">
                  {o.customerName} ({o.customerEmail}) · {o.shippingAddressJson.city},{" "}
                  {o.shippingAddressJson.stateCode} {o.shippingAddressJson.pinCode}
                </p>
                <p className="font-mono-label font-semibold">
                  Total: {formatInrPaise(o.totalPaise)}
                </p>
              </div>
              <OrderTransitionControl
                orderId={o.id}
                currentStatus={o.orderStatus}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-3xl text-[var(--gf-ink)]">
          Return &amp; Refund Queue ({allReturns.length})
        </h2>
        {allReturns.length === 0 ? (
          <p className="text-sm text-[var(--gf-ink-muted)]">
            No return requests currently open.
          </p>
        ) : (
          <div className="space-y-3">
            {allReturns.map((ret) => (
              <div
                key={ret.id}
                className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-[var(--gf-ink)]">
                    {ret.reason} (Order ID {ret.orderId})
                  </p>
                  <Badge tone="amber">{ret.status}</Badge>
                </div>
                <p className="mt-1 text-[var(--gf-ink-muted)]">{ret.details}</p>
                <ReturnResolutionControl
                  returnId={ret.id}
                  currentStatus={ret.status}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
