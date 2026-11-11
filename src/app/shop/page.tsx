import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  listPublicCatalog,
  type CatalogSort,
} from "@/domain/catalog/service";
import { COLLECTIONS } from "@/lib/collections";
import { ProductCard } from "@/components/catalog/ProductCard";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Formulations",
  description:
    "Browse GOODFORM's published India-first daily supplement formulations with search, dietary filters, sorting, and transparent elemental labels.",
  alternates: { canonical: "/shop" },
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;
  const q = firstParam(sp.q) ?? "";
  const collection = firstParam(sp.collection) ?? "all";
  const dietRaw = firstParam(sp.diet);
  const diet: "ALL" | "VEGETARIAN" | "VEGAN" =
    dietRaw === "VEGAN" || dietRaw === "VEGETARIAN" ? dietRaw : "ALL";
  const form = firstParam(sp.form) ?? "ALL";
  const inStockOnly = firstParam(sp.inStock) === "true";
  const sortRaw = firstParam(sp.sort);
  const sort: CatalogSort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "name-asc"
      ? sortRaw
      : "featured";
  const page = Math.max(1, Number(firstParam(sp.page) ?? "1") || 1);

  const result = await listPublicCatalog({
    q,
    collection,
    diet,
    form,
    inStockOnly,
    sort,
    page,
    pageSize: 12,
  });

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (collection !== "all") params.set("collection", collection);
    if (diet !== "ALL") params.set("diet", diet);
    if (form !== "ALL") params.set("form", form);
    if (inStockOnly) params.set("inStock", "true");
    if (sort !== "featured") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 border-b border-[var(--gf-border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="persimmon">Apothecary Dispensary</Badge>
            <Badge tone="lilac">
              {result.totalSeededSkus - result.heldUnpublishedCount} Published ·{" "}
              {result.heldUnpublishedCount} Withheld (FSSAI Gate)
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
            All Published Formulations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--gf-ink-muted)]">
            Showing {result.totalItems} matching formulation
            {result.totalItems === 1 ? "" : "s"} out of{" "}
            {result.totalSeededSkus - result.heldUnpublishedCount} published SKUs ({result.totalSeededSkus} total seeded in catalogue; {result.heldUnpublishedCount} pending India regulatory/botanical review).
          </p>
        </div>

        <Link
          href="/quality#held-skus"
          className="text-xs font-semibold text-[var(--gf-persimmon-ink)] hover:underline shrink-0"
        >
          Why {result.heldUnpublishedCount} SKUs are withheld &rarr;
        </Link>
      </div>

      {/* Filter & Search Bar (no CSS transform on ancestors so native <select> opens everywhere) */}
      <form
        method="GET"
        action="/shop"
        aria-label="Filter and sort formulations"
        className="mt-6 grid gap-3 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="sm:col-span-2 min-w-0">
          <label
            htmlFor="shop-search"
            className="block font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]"
          >
            Search Ingredient or Name
          </label>
          <input
            id="shop-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Magnesium, EPA, B12, Creatine..."
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm text-[var(--gf-ink)]"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="shop-collection"
            className="block font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]"
          >
            Collection
          </label>
          <select
            id="shop-collection"
            name="collection"
            defaultValue={collection}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm text-[var(--gf-ink)]"
          >
            <option value="all">All 8 Collections</option>
            {COLLECTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="shop-diet"
            className="block font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]"
          >
            Dietary Origin
          </label>
          <select
            id="shop-diet"
            name="diet"
            defaultValue={diet}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm text-[var(--gf-ink)]"
          >
            <option value="ALL">All Origins</option>
            <option value="VEGETARIAN">Vegetarian &amp; Vegan</option>
            <option value="VEGAN">Plant-Origin (Vegan) Only</option>
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="shop-form"
            className="block font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]"
          >
            Delivery Form
          </label>
          <select
            id="shop-form"
            name="form"
            defaultValue={form}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm text-[var(--gf-ink)]"
          >
            <option value="ALL">All Forms</option>
            <option value="CAPSULE">Capsules</option>
            <option value="SOFTGEL">Softgels</option>
            <option value="TABLET">Tablets</option>
            <option value="POWDER">Powders</option>
            <option value="LIQUID_SACHET">Sachets</option>
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="shop-sort"
            className="block font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]"
          >
            Sort By
          </label>
          <select
            id="shop-sort"
            name="sort"
            defaultValue={sort}
            className="mt-1 min-h-10 w-full rounded-xl border border-[var(--gf-border)] bg-[var(--gf-bg)] px-3 text-sm text-[var(--gf-ink)]"
          >
            <option value="featured">Featured Dispensary</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gf-border)] pt-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--gf-ink)] cursor-pointer">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={inStockOnly}
              className="h-4 w-4 rounded accent-[var(--gf-persimmon)]"
            />
            <span>In-stock batches only</span>
          </label>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Reset
            </Link>
            <button
              type="submit"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {result.items.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} priority={idx < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-10 text-center">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            No published formulations matched your filter
          </h2>
          <p className="mt-2 text-sm text-[var(--gf-ink-muted)]">
            Note: Shilajit, NAC, Ashwagandha, Milk Thistle, Curcumin, Magnesium L-Threonate, L-Theanine, and Greens Blend remain withheld from sale under our India FSSAI gate.
          </p>
          <div className="mt-5">
            <Link
              href="/shop"
              className={buttonClasses({ variant: "primary", size: "md" })}
            >
              Clear All Filters
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 ? (
        <nav
          aria-label="Catalog pagination"
          className="mt-10 flex items-center justify-center gap-2"
        >
          {result.page > 1 ? (
            <Link
              href={buildPageHref(result.page - 1)}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          ) : null}

          <span className="px-3 font-mono-label text-xs text-[var(--gf-ink-muted)]">
            Page {result.page} of {result.totalPages}
          </span>

          {result.page < result.totalPages ? (
            <Link
              href={buildPageHref(result.page + 1)}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
