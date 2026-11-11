import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";
import {
  getPublicProductBySlug,
  listPublicCatalog,
} from "@/domain/catalog/service";
import { getSiteUrl } from "@/env";
import { BRAND } from "@/lib/brand";
import { DietMark } from "@/components/brand/DietMark";
import { PackshotVisual } from "@/components/catalog/PackshotVisual";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) {
    return { title: "Formulation Not Available" };
  }
  const siteUrl = getSiteUrl();
  return {
    title: product.name,
    description: product.shortSummary,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | ${BRAND.name}`,
      description: product.shortSummary,
      url: `${siteUrl}/product/${product.slug}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedResult = await listPublicCatalog({
    collection: product.primaryCollection,
    pageSize: 4,
  });
  const related = relatedResult.items
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortSummary,
    image: `${siteUrl}${product.imagePath}`,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.startingPricePaise / 100).toFixed(2),
      availability:
        product.totalAvailableStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--gf-ink-muted)]"
      >
        <Link href="/" className="hover:text-[var(--gf-persimmon)]">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[var(--gf-persimmon)]">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/collections/${product.primaryCollection}`}
          className="capitalize hover:text-[var(--gf-persimmon)]"
        >
          {product.primaryCollection}
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--gf-ink)]">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Gallery Column */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <PackshotVisual
            imagePath={product.imagePath}
            productName={product.name}
            isDemoSeed={product.isDemoSeed}
            priority
          />

          {product.macroImagePath ? (
            <figure className="overflow-hidden rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.macroImagePath}
                alt={`${product.name} ingredient macro view`}
                width={720}
                height={480}
                className="w-full rounded-xl object-cover"
              />
              <figcaption className="mt-2 px-1 text-xs text-[var(--gf-ink-muted)]">
                Ingredient form &amp; dispersion study (illustrative macro plate).
              </figcaption>
            </figure>
          ) : null}

          <Callout tone="caution" title="Concept Pack · Seeded Demo Record">
            Packshot artwork and batch numbers represent GOODFORM&apos;s design system. All formulation specs, FoSCoS FBO licence numbers, and lab COAs remain marked demo until owner-confirmed.
          </Callout>
        </div>

        {/* Right Monograph & Purchase Column */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.isFlagship ? (
                <Badge tone="persimmon">Flagship Formulation</Badge>
              ) : null}
              <Badge tone="neutral">
                {product.fssaiCategory.replace(/_/g, " ")}
              </Badge>
              <DietMark dietType={product.dietType} />
            </div>

            <h1 className="font-display text-3xl text-[var(--gf-ink)] sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <p className="text-base font-medium text-[var(--gf-ink-muted)]">
              {product.subtitle}
            </p>

            <p className="text-sm leading-relaxed text-[var(--gf-ink)]">
              {product.editorialDescription}
            </p>

            {product.marketSignalBadge ? (
              <div className="rounded-2xl border border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] px-4 py-3 text-xs text-[var(--gf-lilac-ink)]">
                <span className="font-semibold">Market Signal: </span>
                <span>{product.marketSignalBadge}. </span>
                {product.marketSignalSourceUrl ? (
                  <a
                    href={product.marketSignalSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold underline"
                  >
                    <span>Source</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <ProductPurchasePanel
            productId={product.id}
            productName={product.name}
            variants={product.variants}
          />

          {/* Supplement Facts Apothecary Box */}
          <section
            aria-labelledby="supplement-facts-heading"
            className="supplement-facts-box rounded-2xl"
          >
            <h2
              id="supplement-facts-heading"
              className="font-display text-2xl text-[var(--gf-ink)]"
            >
              Supplement Facts
            </h2>
            <p className="mt-1 font-mono-label text-xs text-[var(--gf-ink-muted)]">
              Serving Size: {product.servingSizeLabel} · Servings Per Pack:{" "}
              {product.servingsPerPack} ({product.netQuantityLabel})
            </p>
            <hr className="supplement-facts-rule-thick" />

            <div className="table-scroll-wrap" tabIndex={0} role="region" aria-label="Supplement facts table">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--gf-border-strong)] font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
                    <th className="py-2 pr-3">Nutrient &amp; Form</th>
                    <th className="py-2 px-3">Per Serving</th>
                    <th className="py-2 pl-3 text-right">% ICMR-NIN RDA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gf-border)]">
                  {product.ingredientsJson.map((ing) => (
                    <tr key={ing.name}>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-[var(--gf-ink)]">
                          {ing.name}
                        </p>
                        <p className="text-xs text-[var(--gf-ink-muted)]">
                          {ing.compoundForm}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 font-mono-label font-semibold whitespace-nowrap">
                        {ing.amountDisplay}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-label text-xs text-[var(--gf-ink-muted)]">
                        {ing.rdaPercentIndia ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <hr className="supplement-facts-rule-thin" />
            <p className="mt-2 text-xs text-[var(--gf-ink-muted)]">
              <strong>Other Ingredients:</strong> {product.otherIngredients}
            </p>
            <p className="mt-1 text-xs text-[var(--gf-ink-muted)]">
              <strong>Allergen &amp; Origin Notes:</strong>{" "}
              {product.allergenFlags.length > 0
                ? product.allergenFlags.join("; ")
                : "Free from major FSSAI mandatory allergens (milk, fish, crustacean, soy, tree nut, peanut, gluten)."}
            </p>
          </section>

          {/* Directions, Warnings, Storage & Compliance Provenance */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 space-y-2">
              <h3 className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
                Directions &amp; Storage
              </h3>
              <p className="text-sm text-[var(--gf-ink)]">
                {product.directionsForUse}
              </p>
              <p className="text-xs text-[var(--gf-ink-muted)]">
                <strong>Storage:</strong> {product.storageInstructions}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 space-y-2">
              <h3 className="font-mono-label text-xs uppercase tracking-wider text-[var(--gf-ink-muted)]">
                Regulatory &amp; Provenance Record
              </h3>
              <ul className="space-y-1 text-xs text-[var(--gf-ink-muted)]">
                <li>
                  <strong>Jurisdiction:</strong> India ({product.jurisdiction})
                </li>
                <li>
                  <strong>Category:</strong>{" "}
                  {product.fssaiCategory.replace(/_/g, " ")}
                </li>
                <li>
                  <strong>FoSCoS FBO Licence:</strong>{" "}
                  {product.fboLicenseVerified && product.fboLicenseNumber
                    ? product.fboLicenseNumber
                    : "Pending owner verification (demo seed)"}
                </li>
                <li>
                  <strong>Lab COA Status:</strong>{" "}
                  {product.ownerEvidenceJson.labTestingVerified &&
                  product.ownerEvidenceJson.coaUrl
                    ? "Verified COA attached"
                    : "Unverified in demo seed (no fabricated COA)"}
                </li>
                <li>
                  <strong>Maker:</strong> {product.manufacturerName}
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] p-4 text-xs text-[var(--gf-amber-ink)]">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Mandatory FSSAI Label Warnings</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {product.warningsJson.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-[var(--gf-border)] pt-12">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            More from {product.primaryCollection}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
