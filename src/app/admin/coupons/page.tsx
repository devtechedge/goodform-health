import React from "react";
import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { coupons } from "@/db/schema/commerce";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { formatInrPaise } from "@/lib/india";
import { AdminNav } from "@/components/admin/AdminNav";
import { CouponUpsertForm } from "@/components/admin/AdminComplianceAndCouponsClient";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Coupons",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const actor = await requireAdminPageUser("admin:access");
  const db = await getDb();
  const rows = await db.select().from(coupons);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <AdminNav actor={actor} currentPath="/admin/coupons" />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CouponUpsertForm />
        </div>

        <div className="lg:col-span-7 space-y-3">
          <h1 className="font-display text-3xl text-[var(--gf-ink)]">
            Active &amp; Seeded Promo Codes ({rows.length})
          </h1>
          {rows.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-label text-sm font-bold text-[var(--gf-ink)]">
                    {c.code}
                  </span>
                  <Badge tone={c.isActive ? "verbena" : "neutral"}>
                    {c.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <p className="mt-1 text-[var(--gf-ink-muted)]">{c.description}</p>
              </div>
              <div className="text-right font-mono-label text-[var(--gf-ink-muted)]">
                <p>
                  {c.discountType === "PERCENT"
                    ? `${c.discountValue}% off`
                    : `${formatInrPaise(c.discountValue)} off`}
                </p>
                <p>Min: {formatInrPaise(c.minSubtotalPaise)}</p>
                <p>
                  Used: {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
