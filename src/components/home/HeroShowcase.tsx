import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";
import type { HydratedProduct } from "@/domain/catalog/service";
import { BRAND } from "@/lib/brand";
import { formatInrPaise } from "@/lib/india";
import { PackshotVisual } from "@/components/catalog/PackshotVisual";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

export interface HeroShowcaseProps {
  flagship: HydratedProduct | null;
  publishedCount: number;
  heldCount: number;
}

export function HeroShowcase({
  flagship,
  publishedCount,
  heldCount,
}: HeroShowcaseProps) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--gf-border)] bg-[var(--gf-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="persimmon">Modern Indian Apothecary</Badge>
              <Badge tone="lilac">
                {publishedCount} Published · {heldCount} Held by FSSAI Gate
              </Badge>
            </div>

            <h1 className="font-display text-4xl leading-[1.08] text-[var(--gf-ink)] sm:text-5xl lg:text-6xl">
              {BRAND.tagline}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-[var(--gf-ink-muted)] sm:text-lg">
              Everyday single-brand nutrition formulated for Indian kitchens, indoor workdays, and active routines. We print both compound salt weight and true elemental milligrams on every label, with zero fake reviews, zero proprietary blends, and strict FSSAI publishing gates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/shop"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                <span>Shop All Formulations</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/routine-builder"
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                Build Your Routine
              </Link>
            </div>

            <dl className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-3.5">
                <dt className="flex items-center gap-1.5 font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--gf-verbena-ink)]" aria-hidden="true" />
                  Elemental Honesty
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--gf-ink)]">
                  Zero Oxide Buffering
                </dd>
              </div>
              <div className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-3.5">
                <dt className="flex items-center gap-1.5 font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]">
                  <Shield className="h-3.5 w-3.5 text-[var(--gf-lilac-ink)]" aria-hidden="true" />
                  FSSAI Gate Active
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--gf-ink)]">
                  ICMR-NIN Bounded
                </dd>
              </div>
              <div className="rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-3.5">
                <dt className="font-mono-label text-[11px] uppercase tracking-wider text-[var(--gf-ink-muted)]">
                  INR Paise-Exact
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--gf-ink)]">
                  CGST/SGST &amp; IGST Ready
                </dd>
              </div>
            </dl>
          </div>

          {flagship ? (
            <div className="lg:col-span-5 min-w-0">
              <div className="rounded-[2rem] border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge tone="persimmon">Flagship Formulation</Badge>
                  <span className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
                    {flagship.sku}
                  </span>
                </div>

                <Link href={`/product/${flagship.slug}`} className="group block">
                  <PackshotVisual
                    imagePath={flagship.imagePath}
                    productName={flagship.name}
                    isDemoSeed={flagship.isDemoSeed}
                    priority
                  />
                </Link>

                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-2xl text-[var(--gf-ink)]">
                      <Link
                        href={`/product/${flagship.slug}`}
                        className="hover:text-[var(--gf-persimmon)]"
                      >
                        {flagship.name}
                      </Link>
                    </h2>
                    <span className="font-mono-label text-lg font-semibold text-[var(--gf-ink)] shrink-0">
                      {formatInrPaise(flagship.startingPricePaise)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--gf-ink-muted)]">
                    {flagship.shortSummary}
                  </p>
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <span className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
                      250 mg Reduced GSH · 30 Servings
                    </span>
                    <Link
                      href={`/product/${flagship.slug}`}
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      Inspect Label
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
