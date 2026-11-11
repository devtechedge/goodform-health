import React from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { BRAND } from "@/lib/brand";
import { COLLECTIONS } from "@/lib/collections";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--gf-border)] bg-[var(--gf-surface-muted)] text-[var(--gf-ink)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <Wordmark size="lg" />
            <p className="font-display text-xl text-[var(--gf-ink)]">
              {BRAND.tagline}
            </p>
            <p className="text-sm leading-relaxed text-[var(--gf-ink-muted)]">
              {BRAND.shortPitch}
            </p>
            <p className="font-mono-label text-xs text-[var(--gf-ink-muted)]">
              Quality &amp; Grievance Desk: {BRAND.qualityEmail}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-ink-muted)]">
              Collections
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
              {COLLECTIONS.map((col) => (
                <li key={col.slug}>
                  <Link
                    href={`/collections/${col.slug}`}
                    className="hover:text-[var(--gf-persimmon)]"
                  >
                    {col.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-ink-muted)]">
              Explore
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-[var(--gf-persimmon)]">
                  All Formulations
                </Link>
              </li>
              <li>
                <Link
                  href="/routine-builder"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Routine Builder
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-[var(--gf-persimmon)]">
                  Ingredient Monographs
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--gf-persimmon)]">
                  About GOODFORM
                </Link>
              </li>
              <li>
                <Link
                  href="/quality"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Quality &amp; FSSAI Gate
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--gf-persimmon)]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-mono-label text-xs uppercase tracking-[0.16em] text-[var(--gf-ink-muted)]">
              Care &amp; Policies (India)
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/orders/track"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Track Guest Order
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Contact &amp; Grievance Officer
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Pan-India Shipping &amp; GST
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Returns &amp; Batch Guarantee
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Privacy Notice (DPDP)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--gf-persimmon)]">
                  Terms of Sale
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="hover:text-[var(--gf-persimmon)]"
                >
                  Health &amp; Regulatory Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-4 text-xs leading-relaxed text-[var(--gf-ink-muted)] space-y-1.5">
          <p>
            <strong>Statutory Notice:</strong> {BRAND.fssaiNotice}
          </p>
          <p>
            <strong>Demo Storefront Disclosure:</strong> {BRAND.demoSeedNotice}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--gf-border)] pt-6 text-xs text-[var(--gf-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. Single-merchant consumer storefront · INR (Paise-exact).
          </p>
          <p className="font-mono-label">
            Dispatched from {BRAND.dispatchCity}, {BRAND.dispatchStateName} ({BRAND.dispatchStateCode})
          </p>
        </div>
      </div>
    </footer>
  );
}
