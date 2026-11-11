import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, returnRequests } from "@/db/schema/commerce";
import { auditLogs } from "@/db/schema/content";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { loadAllHydratedProducts } from "@/domain/catalog/service";
import { formatInrPaise } from "@/lib/india";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Overview & Reports",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const actor = await requireAdminPageUser("admin:access");
  const db = await getDb();

  const [allProducts, allOrders, allReturns, recentAudits] = await Promise.all([
    loadAllHydratedProducts(db),
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(returnRequests),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
  ]);

  const publishedCount = allProducts.filter(
    (p) => p.gateVerdict.canAppearInPublicStore,
  ).length;
  const heldCount = allProducts.length - publishedCount;

  const capturedOrders = allOrders.filter(
    (o) => !o.isDemoOrder && o.paymentStatus === "CAPTURED",
  );
  const demoOrders = allOrders.filter((o) => o.isDemoOrder);

  const realCapturedPaise = capturedOrders.reduce(
    (sum, o) => sum + o.totalPaise,
    0,
  );
  const demoVolumePaise = demoOrders.reduce((sum, o) => sum + o.totalPaise, 0);

  const lowStockVariants = allProducts
    .filter((p) => p.gateVerdict.canAppearInPublicStore)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.availableStock < 50)
        .map((v) => ({ productName: p.name, ...v })),
    );

  const openReturnsCount = allReturns.filter(
    (r) => r.status === "REQUESTED",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav actor={actor} currentPath="/admin" />

      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Dispensary Operations &amp; Reports
      </h1>
      <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
        Real captured revenue and non-charging demo orders are strictly separated so financial reporting never conflates demo previews with paid GMV.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5">
          <p className="font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]">
            Catalogue SKUs
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {allProducts.length}
          </p>
          <p className="mt-1 text-xs text-[var(--gf-ink-muted)]">
            {publishedCount} published · {heldCount} held by FSSAI gate
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--gf-verbena-border)] bg-[var(--gf-verbena-soft)] p-5 text-[var(--gf-verbena-ink)]">
          <p className="font-mono-label text-xs uppercase">
            Captured Paid Revenue
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {formatInrPaise(realCapturedPaise)}
          </p>
          <p className="mt-1 text-xs">
            {capturedOrders.length} verified provider order(s)
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] p-5 text-[var(--gf-amber-ink)]">
          <p className="font-mono-label text-xs uppercase">
            Demo Checkout Volume (Unpaid)
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {formatInrPaise(demoVolumePaise)}
          </p>
          <p className="mt-1 text-xs">
            {demoOrders.length} non-charging DEMO_ORDER record(s)
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5">
          <p className="font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]">
            Open Return Requests
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {openReturnsCount}
          </p>
          <p className="mt-1 text-xs text-[var(--gf-ink-muted)]">
            Total logged returns: {allReturns.length}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-6 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              Batch Replenishment Watch (&lt; 50 units)
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[var(--gf-persimmon-ink)] underline"
            >
              Manage Stock
            </Link>
          </div>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-[var(--gf-ink-muted)]">
              All published variants hold 50+ units in stock.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--gf-border)] text-xs">
              {lowStockVariants.map((v) => (
                <li
                  key={v.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <span>
                    <strong>{v.productName}</strong> ({v.title}) · Batch{" "}
                    {v.batchNumber}
                  </span>
                  <span className="font-mono-label font-semibold">
                    {v.availableStock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-6 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              Latest Audit Log Entries
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-[var(--gf-persimmon-ink)] underline"
            >
              Full Trail
            </Link>
          </div>
          {recentAudits.length === 0 ? (
            <p className="text-sm text-[var(--gf-ink-muted)]">
              No staff mutations logged yet in this session.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--gf-border)] text-xs">
              {recentAudits.map((a) => (
                <li key={a.id} className="py-2.5">
                  <p className="font-semibold text-[var(--gf-ink)]">
                    [{a.actorRole}] {a.action}
                  </p>
                  <p className="text-[var(--gf-ink-muted)]">{a.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
