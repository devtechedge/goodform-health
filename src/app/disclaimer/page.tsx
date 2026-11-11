import React from "react";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";

export const metadata: Metadata = {
  title: "Health & Regulatory Disclaimer",
  description:
    "Mandatory FSSAI non-medicinal statement, non-endorsement notice, Routine Builder non-diagnostic scope, and demo seed disclosures.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <Badge tone="amber">Mandatory Statutory Notice</Badge>
      <h1 className="font-display text-4xl text-[var(--gf-ink)]">
        Health, Regulatory &amp; Demo Disclaimer
      </h1>

      <Callout tone="caution" title="NOT FOR MEDICINAL USE">
        {BRAND.fssaiNotice}
      </Callout>

      <div className="rounded-3xl border border-[var(--gf-border)] bg-[var(--gf-surface)] p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-[var(--gf-ink-muted)]">
        <p>
          <strong className="text-[var(--gf-ink)]">No Medical Advice or Diagnosis:</strong> Product descriptions, <code className="font-mono-label">/learn</code> monographs, and the <code className="font-mono-label">/routine-builder</code> overlap calculator are provided solely for general nutritional and label-reading literacy. Always consult a registered medical practitioner before starting any supplement, particularly if pregnant, nursing, under 18, taking prescription medication (including anticoagulants or thyroid therapy), or managing a health condition.
        </p>
        <p>
          <strong className="text-[var(--gf-ink)]">No FSSAI Endorsement or Invented Certifications:</strong> References to FSSAI Health Supplements / Nutraceuticals Regulations (2016) and Advertising &amp; Claims Regulations (2018) describe the compliance rules enforced by our software gate. FSSAI does not endorse GOODFORM. Seeded demo products display concept packaging and intentionally leave FoSCoS licence numbers, GMP, organic, IFOS, vegan-logo, and laboratory COA fields marked unverified until confirmed with real owner documentation.
        </p>
      </div>
    </div>
  );
}
