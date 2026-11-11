import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About GOODFORM",
  description:
    "Single-brand daily nutrition built for life in India: elemental stoichiometry, ICMR-NIN alignment, and zero synthetic social proof.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <header className="space-y-3 border-b border-[var(--gf-border)] pb-8">
        <Badge tone="persimmon">Single-Brand Consumer Retail</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)] sm:text-5xl">
          {BRAND.tagline}
        </h1>
        <p className="text-base leading-relaxed text-[var(--gf-ink-muted)]">
          GOODFORM is a single-merchant everyday apothecary created for Indian households who read back panels more closely than ad slogans.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-2.5">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Elemental math in plain sight
          </h2>
          <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
            Every mineral, lipid, and vitamin jar states both the compound salt weight and the actual elemental nutrient delivered per serving, calibrated to ICMR-NIN daily reference allowances.
          </p>
        </section>

        <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-2.5">
          <h2 className="font-display text-2xl text-[var(--gf-ink)]">
            Zero fabricated social proof
          </h2>
          <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
            We display zero fake star ratings, zero invented customer reviews, zero countdown scarcity timers, and zero unverified laboratory seals. Category popularity notes cite external research with methodology caveats intact.
          </p>
        </section>
      </div>

      <section className="rounded-3xl border border-[var(--gf-lilac-border)] bg-[var(--gf-lilac)] p-7 space-y-3">
        <h2 className="font-display text-2xl text-[var(--gf-lilac-ink)]">
          One merchant, direct accountability
        </h2>
        <p className="text-sm leading-relaxed text-[var(--gf-lilac-ink)]">
          Unlike multi-seller marketplaces where third-party vendors list unvetted gummies and proprietary blends, every SKU on GOODFORM passes through one unified formulation, batch, and India FSSAI publishing gate.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/quality" className={buttonClasses({ variant: "secondary" })}>
            Inspect Quality &amp; FSSAI Gate
          </Link>
          <Link href="/shop" className={buttonClasses({ variant: "outline" })}>
            Explore the Dispensary
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-7 space-y-4">
        <Badge tone="neutral">Nov 2026 India Shelf Context</Badge>
        <h2 className="font-display text-2xl text-[var(--gf-ink)]">
          Why single-brand apothecary retail wins in India
        </h2>
        <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
          Tracked non-protein supplement volume on Amazon India exceeds an estimated INR 991.3 crore floor annually across 435 brands, with Indian D2C brands holding 41.1% of shelf value (impuls8, Nov 2026; Diwali-week badge lower bound, not audited GMV). Yet the largest everyday categories remain deeply fragmented: Omega &amp; Fish Oil (INR 121.9cr, top share 18%), Multivitamins (INR 111.0cr, top share 21%), Magnesium (INR 86.3cr, top share 15%, +1.27x YoY search), and Collagen (INR 60.5cr).
        </p>
        <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
          Across Indian buyer communities and urban workforce surveys (Loop Health WHI 2026; ConsumerLab 2026), repeat retention hinges on two things: transparent elemental chemistry without oxide buffering, and multi-jar daily routines that prevent accidental micronutrient duplication.
        </p>
      </section>
    </div>
  );
}
