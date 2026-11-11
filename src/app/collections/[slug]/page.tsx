import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPublicCatalog } from "@/domain/catalog/service";
import { COLLECTIONS, getCollectionBySlug } from "@/lib/collections";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) {
    return { title: "Collection Not Found" };
  }
  return {
    title: `${col.name} Collection`,
    description: col.editorialIntro,
    alternates: { canonical: `/collections/${col.slug}` },
    openGraph: {
      title: `${col.name} Collection | GOODFORM`,
      description: col.editorialIntro,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${col.name} Collection | GOODFORM`,
        },
      ],
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionPageProps) {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) {
    notFound();
  }

  const catalog = await listPublicCatalog({
    collection: col.slug,
    pageSize: 40,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-6 sm:p-10">
        <Badge tone="persimmon">{col.eyebrow}</Badge>
        <h1 className="mt-3 font-display text-4xl text-[var(--gf-ink)] sm:text-5xl">
          {col.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--gf-ink-muted)]">
          {col.editorialIntro}
        </p>
        <p className="mt-4 font-mono-label text-xs text-[var(--gf-persimmon-ink)]">
          Typical Routine Window: {col.routineWindow} · {catalog.totalItems} Published SKU
          {catalog.totalItems === 1 ? "" : "s"}
        </p>

        <nav
          aria-label="Switch collection"
          className="mt-6 flex flex-wrap gap-2 border-t border-[var(--gf-border)] pt-5"
        >
          {COLLECTIONS.map((item) => {
            const active = item.slug === col.slug;
            return (
              <Link
                key={item.slug}
                href={`/collections/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--gf-aubergine)] text-[var(--gf-on-aubergine)]"
                    : "border border-[var(--gf-border)] bg-[var(--gf-bg)] text-[var(--gf-ink)] hover:bg-[var(--gf-surface-muted)]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalog.items.map((prod, idx) => (
          <ProductCard key={prod.id} product={prod} priority={idx < 3} />
        ))}
      </div>
    </div>
  );
}
