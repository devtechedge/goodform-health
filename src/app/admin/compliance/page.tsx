import React from "react";
import type { Metadata } from "next";
import { requireAdminPageUser } from "@/domain/auth/rbac";
import { loadAllHydratedProducts } from "@/domain/catalog/service";
import { AdminNav } from "@/components/admin/AdminNav";
import { ComplianceGateRowEditor } from "@/components/admin/AdminComplianceAndCouponsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · India FSSAI Publishing Gate",
  robots: { index: false, follow: false },
};

export default async function AdminCompliancePage() {
  const actor = await requireAdminPageUser("admin:access");
  const all = await loadAllHydratedProducts();

  // Sort held SKUs to the top so compliance reviewers inspect blocked SKUs immediately
  const sorted = [...all].sort((a, b) => {
    const aHeld = !a.gateVerdict.canAppearInPublicStore;
    const bHeld = !b.gateVerdict.canAppearInPublicStore;
    if (aHeld !== bHeld) return aHeld ? -1 : 1;
    return a.sku.localeCompare(b.sku);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminNav actor={actor} currentPath="/admin/compliance" />

      <div className="mb-6">
        <h1 className="font-display text-3xl text-[var(--gf-ink)] sm:text-4xl">
          India FSSAI Publishing Gate Console
        </h1>
        <p className="mt-1 text-sm text-[var(--gf-ink-muted)]">
          Attempting to set Shilajit, NAC, botanicals, or non-specified ingredients to PUBLISHED without qualified India-specific review clearance and a verified 14-digit FoSCoS licence is hard-blocked on the server.
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((p) => (
          <ComplianceGateRowEditor
            key={p.id}
            product={{
              id: p.id,
              sku: p.sku,
              name: p.name,
              fssaiCategory: p.fssaiCategory,
              complianceReviewState: p.complianceReviewState,
              ingredientEligibilityState: p.ingredientEligibilityState,
              publishStatus: p.publishStatus,
              fboLicenseNumber: p.fboLicenseNumber,
              fboLicenseVerified: p.fboLicenseVerified,
              holdReason: p.holdReason,
              isDemoSeed: p.isDemoSeed,
              violations: p.gateVerdict.violations,
            }}
          />
        ))}
      </div>
    </div>
  );
}
