import React from "react";
import type { Metadata } from "next";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { loadAllHydratedProducts } from "@/domain/catalog/service";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  ProductMerchandisingEditor,
  VariantInventoryRowEditor,
} from "@/components/admin/AdminCatalogForms";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · 40 SKUs, Prices & Batches",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const actor = await requireAdminPageUser("admin:access");
  const products = await loadAllHydratedProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav actor={actor} currentPath="/admin/products" />

      <div className="mb-6">
        <h1 className="font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
          All {products.length} Seeded SKUs · Merchandising, Prices &amp; Batches
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Edit copy (validated against FSSAI Advertising &amp; Claims rules), INR pricing, stock on hand, batch codes, and expiry dates across all 40 SKUs.
        </p>
      </div>

      <div className="space-y-4">
        {products.map((prod) => (
          <details
            key={prod.id}
            className="group rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
                  {prod.sku}
                </span>
                <span className="font-display text-xl text-[var(--gf-ink)]">
                  {prod.name}
                </span>
                <Badge
                  tone={prod.gateVerdict.canAppearInPublicStore ? "verbena" : "amber"}
                >
                  {prod.gateVerdict.canAppearInPublicStore
                    ? "PUBLISHED"
                    : `HELD (${prod.complianceReviewState})`}
                </Badge>
              </div>
              <span className="font-mono-label text-xs text-[var(--gf-persimmon-ink)]">
                {prod.variants.length} variant(s) · Stock {prod.totalAvailableStock}
              </span>
            </summary>

            <div className="mt-5 grid gap-5 border-t border-[var(--gf-border)] pt-5 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <ProductMerchandisingEditor
                  product={{
                    id: prod.id,
                    sku: prod.sku,
                    name: prod.name,
                    subtitle: prod.subtitle,
                    shortSummary: prod.shortSummary,
                    featuredRank: prod.featuredRank,
                  }}
                />
              </div>
              <div className="lg:col-span-7 space-y-2.5">
                {prod.variants.map((v) => (
                  <VariantInventoryRowEditor key={v.id} variant={v} />
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
