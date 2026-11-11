import React from "react";
import type { Metadata } from "next";
import { loadAllHydratedProducts } from "@/domain/catalog/service";
import { BRAND } from "@/lib/brand";
import { BatchComplianceVerifier } from "@/components/quality/BatchComplianceVerifier";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quality Charter & India FSSAI Gate",
  description:
    "How GOODFORM enforces FSSAI Nutraceutical & Advertising/Claims regulations, withholds pending SKUs, and discloses demo vs owner-verified evidence.",
  alternates: { canonical: "/quality" },
};

export default async function QualityPage() {
  const all = await loadAllHydratedProducts();
  const published = all.filter((p) => p.gateVerdict.canAppearInPublicStore);
  const held = all.filter((p) => !p.gateVerdict.canAppearInPublicStore);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <header className="space-y-3 border-b border-[var(--gf-border)] pb-8">
        <Badge tone="persimmon">Governance &amp; Substantiation</Badge>
        <h1 className="font-display text-4xl text-[var(--gf-ink)] sm:text-5xl">
          Quality Charter &amp; India FSSAI Publishing Gate
        </h1>
        <p className="text-base leading-relaxed text-[var(--gf-ink-muted)]">
          Our server-side compliance engine evaluates every SKU before it can appear in public search, collections, the Routine Builder, or checkout.
        </p>
      </header>

      <Callout tone="caution" title="FSSAI Non-Endorsement & Demo Seed Disclosure">
        Referencing the Food Safety and Standards Act and FSSAI regulations describes our software governance rules only and never implies FSSAI endorsement or approval. In this seeded demo environment ({published.length} published, {held.length} withheld out of {all.length} SKUs), FoSCoS FBO licence numbers, GMP status, and batch COAs are explicitly marked unverified until confirmed by the store owner.
      </Callout>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-5">
          <p className="font-mono-label text-xs uppercase text-[var(--gf-ink-muted)]">
            Total Seeded Catalogue
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {all.length} SKUs
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--gf-verbena-border)] bg-[var(--gf-verbena-soft)] p-5 text-[var(--gf-verbena-ink)]">
          <p className="font-mono-label text-xs uppercase">
            Published (Demo Store)
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {published.length} SKUs
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--gf-amber-border)] bg-[var(--gf-amber-soft)] p-5 text-[var(--gf-amber-ink)]">
          <p className="font-mono-label text-xs uppercase">
            Blocked / Unpublished Hold
          </p>
          <p className="mt-2 font-mono-label text-3xl font-semibold">
            {held.length} SKUs
          </p>
        </div>
      </div>

      <BatchComplianceVerifier />

      <section id="held-skus" className="space-y-4">
        <h2 className="font-display text-3xl text-[var(--gf-ink)]">
          Withheld Formulations ({held.length} SKUs Blocked from Retail)
        </h2>
        <p className="text-sm text-[var(--gf-ink-muted)]">
          Under GOODFORM&apos;s India publishing gate, Shilajit, NAC, botanical extracts, and non-specified salts remain unpublished and non-purchasable pending qualified India-specific legal, CDSCO/AYUSH, or Schedule IV sign-off.
        </p>

        <div
          className="table-scroll-wrap rounded-2xl border border-[var(--gf-border)] bg-[var(--gf-surface)]"
          tabIndex={0}
          role="region"
          aria-label="Withheld formulations compliance table"
        >
          <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
            <thead className="border-b border-[var(--gf-border)] bg-[var(--gf-surface-muted)] font-mono-label text-[11px] uppercase text-[var(--gf-ink-muted)]">
              <tr>
                <th className="px-4 py-3">SKU &amp; Formulation</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Review State</th>
                <th className="px-4 py-3">India Hold Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gf-border)]">
              {held.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-[var(--gf-ink)]">
                    <span className="block font-mono-label text-xs text-[var(--gf-ink-muted)]">
                      {p.sku}
                    </span>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 font-mono-label text-xs">
                    {p.fssaiCategory.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="amber">
                      {p.complianceReviewState.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--gf-ink-muted)]">
                    {p.holdReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 space-y-2 text-sm text-[var(--gf-ink-muted)]">
        <h2 className="font-display text-2xl text-[var(--gf-ink)]">
          Quality &amp; Consumer Grievance Contact
        </h2>
        <p>
          <strong>Quality &amp; Batch Verification Desk:</strong>{" "}
          {BRAND.qualityEmail}
        </p>
        <p>
          <strong>Consumer Grievance Officer:</strong> {BRAND.grievanceEmail}
        </p>
        <p>
          <strong>Dispatch &amp; Registered Office (Demo):</strong>{" "}
          {BRAND.registeredAddressDemo}
        </p>
      </section>
    </div>
  );
}
