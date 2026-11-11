import { describe, expect, it } from "vitest";
import { ALL_40_SKUS } from "@/db/seeds/all-skus";
import { PACKSHOT_SPECS } from "@/lib/packshot-manifest";
import {
  evaluateFssaiPublishingGate,
  isValidFoscosLicenseNumber,
  validateClaimsCopy,
} from "@/domain/compliance/fssai-gate";

describe("40-SKU Catalogue & India FSSAI Publishing Gate", () => {
  it("contains exactly the 40 required SKUs and matching local packshot specs", () => {
    expect(ALL_40_SKUS).toHaveLength(40);
    expect(PACKSHOT_SPECS).toHaveLength(40);

    const slugs = new Set(ALL_40_SKUS.map((s) => s.slug));
    expect(slugs.size).toBe(40);
    for (const spec of PACKSHOT_SPECS) {
      expect(slugs.has(spec.slug)).toBe(true);
    }
  });

  it("publishes 32 compliant SKUs in demo mode and blocks all 8 pending SKUs (Shilajit, NAC, botanicals, non-specified)", () => {
    const verdicts = ALL_40_SKUS.map((s) => ({
      slug: s.slug,
      verdict: evaluateFssaiPublishingGate(
        {
          slug: s.slug,
          name: s.name,
          jurisdiction: "IN",
          fssaiCategory: s.fssaiCategory,
          ingredientEligibilityState: s.ingredientEligibilityState,
          complianceReviewState: s.complianceReviewState,
          publishStatus: s.publishStatus,
          fboLicenseNumber: null,
          fboLicenseVerified: false,
          manufacturerName: s.manufacturerName,
          warningsJson: [...s.warnings],
          shortSummary: s.shortSummary,
          editorialDescription: s.editorialDescription,
          labelSummary: s.labelSummary,
          isDemoSeed: true,
          activeVariants: s.variants.map((v) => ({
            sku: v.sku,
            batchNumber: v.batchNumber,
            expiryDate: v.expiryDate,
          })),
        },
        { appEnv: "demo", referenceDateIso: "2026-11-11" },
      ),
    }));

    const published = verdicts.filter((v) => v.verdict.canAppearInPublicStore);
    const blocked = verdicts.filter((v) => !v.verdict.canAppearInPublicStore);

    expect(published).toHaveLength(32);
    expect(blocked).toHaveLength(8);

    const blockedSlugs = blocked.map((b) => b.slug).sort();
    expect(blockedSlugs).toEqual(
      [
        "ashwagandha-root-extract",
        "curcumin-piperine",
        "greens-superfoods-blend",
        "l-theanine",
        "magnesium-l-threonate",
        "milk-thistle-extract",
        "nac",
        "shilajit",
      ].sort(),
    );
  });

  it("blocks demo seeds in commercial production until owner-verified with a 14-digit FoSCoS licence", () => {
    const flagship = ALL_40_SKUS[0]!;
    const blockedInProd = evaluateFssaiPublishingGate(
      {
        slug: flagship.slug,
        name: flagship.name,
        jurisdiction: "IN",
        fssaiCategory: flagship.fssaiCategory,
        ingredientEligibilityState: "ELIGIBLE_WITHIN_LIMITS",
        complianceReviewState: "APPROVED_DEMO_SEED",
        publishStatus: "PUBLISHED",
        fboLicenseNumber: null,
        fboLicenseVerified: false,
        manufacturerName: flagship.manufacturerName,
        warningsJson: [...flagship.warnings],
        shortSummary: flagship.shortSummary,
        editorialDescription: flagship.editorialDescription,
        labelSummary: flagship.labelSummary,
        isDemoSeed: true,
        activeVariants: [
          {
            sku: "GF-ANT-001-30",
            batchNumber: "GF26K01D",
            expiryDate: "2028-03-14",
          },
        ],
      },
      { appEnv: "production", referenceDateIso: "2026-11-11" },
    );

    expect(blockedInProd.allowed).toBe(false);
    expect(
      blockedInProd.violations.map((v) => v.code),
    ).toContain("DEMO_SEED_IN_PRODUCTION");
    expect(
      blockedInProd.violations.map((v) => v.code),
    ).toContain("FBO_LICENSE_REQUIRED_IN_PROD");

    expect(isValidFoscosLicenseNumber("11524001000999")).toBe(true);
    expect(isValidFoscosLicenseNumber("12345")).toBe(false);
  });

  it("rejects prohibited disease, hormone, detox, and FSSAI/FDA endorsement claims", () => {
    const clean = validateClaimsCopy({
      shortSummary: "240 mg elemental magnesium from bisglycinate.",
      editorialDescription: "Formulated without exaggerated anti-ageing claims.",
      labelSummary: "Health Supplement. Not for medicinal use.",
    });
    expect(clean).toHaveLength(0);

    const bad = validateClaimsCopy({
      shortSummary: "FSSAI approved capsule that cures diabetes and fatty liver.",
      editorialDescription: "Boosts testosterone and melts belly fat overnight.",
      labelSummary: "FDA certified miracle.",
    });
    expect(bad.length).toBeGreaterThanOrEqual(3);
  });

  it("blocks expired batches and missing statutory NOT FOR MEDICINAL USE warnings", () => {
    const base = ALL_40_SKUS[3]!;
    const verdict = evaluateFssaiPublishingGate(
      {
        slug: base.slug,
        name: base.name,
        jurisdiction: "IN",
        fssaiCategory: base.fssaiCategory,
        ingredientEligibilityState: "ELIGIBLE_WITHIN_LIMITS",
        complianceReviewState: "APPROVED_DEMO_SEED",
        publishStatus: "PUBLISHED",
        fboLicenseNumber: null,
        fboLicenseVerified: false,
        manufacturerName: base.manufacturerName,
        warningsJson: ["Keep out of reach of children."],
        shortSummary: base.shortSummary,
        editorialDescription: base.editorialDescription,
        labelSummary: base.labelSummary,
        isDemoSeed: true,
        activeVariants: [
          {
            sku: "GF-FND-004-45",
            batchNumber: "EXP01",
            expiryDate: "2025-01-01",
          },
        ],
      },
      { appEnv: "demo", referenceDateIso: "2026-11-11" },
    );

    expect(verdict.allowed).toBe(false);
    const codes = verdict.violations.map((v) => v.code);
    expect(codes).toContain("MISSING_NOT_FOR_MEDICINAL_USE");
    expect(codes).toContain("MISSING_DAILY_USAGE_WARNING");
    expect(codes).toContain("EXPIRED_OR_INVALID_BATCH");
  });
});
