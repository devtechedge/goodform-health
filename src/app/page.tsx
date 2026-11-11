import React from "react";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Beaker, Layers, Scale } from "lucide-react";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema/content";
import { getFeaturedHomeProducts } from "@/domain/catalog/service";
import { COLLECTIONS } from "@/lib/collections";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { NewsletterConsentForm } from "@/components/home/NewsletterConsentForm";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const [homeData, faqRows] = await Promise.all([
    getFeaturedHomeProducts(8, db),
    db
      .select()
      .from(faqs)
      .where(eq(faqs.isPublished, true))
      .orderBy(asc(faqs.sortOrder)),
  ]);

  const homeFaqs = faqRows.slice(0, 5);

  return (
    <div>
      <HeroShowcase
        flagship={homeData.flagship}
        publishedCount={homeData.publishedCount}
        heldCount={homeData.heldProducts.length}
      />

      {/* Asymmetric Featured Formulations */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-persimmon-ink)]">
              Daily Dispensary · {homeData.publishedCount} Active Formulations
            </p>
            <h2 className="mt-1 font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
              Formulated around open Indian nutrient gaps
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gf-persimmon-ink)] hover:underline"
          >
            <span>Browse full 32-item shelf</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homeData.featured.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} priority={idx < 2} />
          ))}
        </div>
      </section>

      {/* 8 Curated Apothecary Shelves */}
      <section className="border-y border-[var(--gf-border)] bg-[var(--gf-surface-muted)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-ink-muted)]">
              Eight Shelves
            </p>
            <h2 className="mt-1 font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
              Browse by everyday function, never miracle claims
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((col, idx) => (
              <Link
                key={col.slug}
                href={`/collections/${col.slug}`}
                className={`group flex flex-col justify-between rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5 transition-colors hover:border-[var(--gf-persimmon)] ${
                  idx === 0 || idx === 7 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <span className="font-mono-label text-[11px] uppercase tracking-[0.15em] text-[var(--gf-ink-muted)]">
                    0{idx + 1} · {col.eyebrow}
                  </span>
                  <h3 className="mt-2 font-display text-2xl text-[var(--gf-ink)] group-hover:text-[var(--gf-persimmon)]">
                    {col.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--gf-ink-muted)]">
                    {col.shortDescription}
                  </p>
                </div>
                <p className="mt-4 font-mono-label text-[11px] text-[var(--gf-persimmon-ink)]">
                  {col.routineWindow} &rarr;
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ingredient Macro Chemistry Spotlight */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <Badge tone="lilac">Ingredient Macro Ledger</Badge>
            <h2 className="font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
              Why our jars print two milligram numbers
            </h2>
            <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
              Unbuffered magnesium bisglycinate is ~14% elemental magnesium by molecular weight. When a retail capsule claims 400 mg elemental magnesium from a 500 mg pill, stoichiometry proves undeclared magnesium oxide buffering. GOODFORM prints both the chelate salt weight and the true elemental yield on every jar.
            </p>
            <div className="pt-2">
              <Link
                href="/learn/reading-indian-supplement-labels-elemental-vs-compound"
                className={buttonClasses({ variant: "outline", size: "md" })}
              >
                Read the Label Chemistry Guide
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/macros/chelated-mineral.svg"
                alt="Chelated mineral stoichiometry diagram"
                width={720}
                height={480}
                className="w-full rounded-2xl object-cover"
              />
              <figcaption className="mt-2.5 px-1 text-xs text-[var(--gf-ink-muted)]">
                1,715 mg Magnesium Bisglycinate = 240 mg true elemental Mg.
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/macros/liposomal-vesicle.svg"
                alt="Sunflower phospholipid liposome bilayer illustration"
                width={720}
                height={480}
                className="w-full rounded-2xl object-cover"
              />
              <figcaption className="mt-2.5 px-1 text-xs text-[var(--gf-ink-muted)]">
                Non-soy sunflower phospholipids in Flagship Liposomal Glutathione &amp; Liposomal C.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Routine Builder + FSSAI Governance Split */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-[2rem] border border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] p-7 sm:p-9 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-lilac-ink)]">
                Non-Diagnostic Stack Planner
              </span>
              <h2 className="font-display text-3xl text-[var(--gf-lilac-ink)]">
                Spot overlapping Vitamin D, Zinc, Magnesium &amp; Biotin before you buy
              </h2>
              <p className="text-sm leading-relaxed text-[var(--gf-lilac-ink)]/90">
                Combining a Daily Multivitamin with standalone Vitamin D3, Biotin Complex, and Electrolyte sachets can quietly double micronutrient intake. Our Routine Builder sums elemental nutrients across your selections, flags ICMR-NIN overlap cautions, and generates a shareable stack link.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/routine-builder"
                className={buttonClasses({ variant: "secondary", size: "md" })}
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Open Routine Builder</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[2rem] border border-[var(--gf-border-strong)] bg-[var(--gf-surface)] p-7 sm:p-9 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono-label uppercase tracking-wider text-[var(--gf-ink-muted)]">
              <Scale className="h-4 w-4 text-[var(--gf-persimmon)]" aria-hidden="true" />
              <span>India FSSAI Publishing Gate</span>
            </div>
            <h2 className="font-display text-2xl text-[var(--gf-ink)]">
              Why 8 of our 40 seeded SKUs stay unpublished
            </h2>
            <p className="text-xs leading-relaxed text-[var(--gf-ink-muted)]">
              Our database holds all {homeData.totalSeededCount} formulations, but {homeData.heldProducts.length} SKUs ({homeData.heldProducts.map((h) => h.name).join(", ")}) are automatically blocked from public sale pending India-specific legal, CDSCO/AYUSH, Schedule IV botanical, or Non-Specified Food clearance.
            </p>
            <Callout tone="caution" title="Zero Invented Certifications">
              Seeded records display concept packshots and keep FoSCoS licence / COA fields marked unverified until owner-confirmed.
            </Callout>
            <div>
              <Link
                href="/quality"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gf-persimmon-ink)] hover:underline"
              >
                <Beaker className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Inspect full FSSAI compliance charter</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ + Explicit Consent Newsletter */}
      <section className="border-t border-[var(--gf-border)] bg-[var(--gf-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-3xl text-[var(--gf-ink)]">
              Common Questions
            </h2>
            <div className="mt-6 divide-y divide-[var(--gf-border)] border-y border-[var(--gf-border)]">
              {homeFaqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm text-[var(--gf-ink)]">
                    <span>{f.question}</span>
                    <span
                      aria-hidden="true"
                      className="font-mono-label text-lg text-[var(--gf-persimmon)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-xs">
              <Link href="/faq" className="font-semibold text-[var(--gf-persimmon-ink)] hover:underline">
                Read all frequently asked questions &rarr;
              </Link>
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-bg)] p-6 sm:p-8 space-y-4">
              <Badge tone="persimmon">Consent-First Dispatch</Badge>
              <h2 className="font-display text-2xl text-[var(--gf-ink)]">
                Formulation monographs, never spam
              </h2>
              <p className="text-sm text-[var(--gf-ink-muted)]">
                Occasional label-reading guides and ingredient research notes with one-click unsubscribe in every message.
              </p>
              <NewsletterConsentForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
