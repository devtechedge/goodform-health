import type {
  ComplianceReviewState,
  FssaiCategory,
  IngredientEligibilityState,
  PublishStatus,
} from "@/db/schema/catalog";

export interface GateSkuCandidate {
  slug: string;
  name: string;
  jurisdiction: string;
  fssaiCategory: FssaiCategory;
  ingredientEligibilityState: IngredientEligibilityState;
  complianceReviewState: ComplianceReviewState;
  publishStatus: PublishStatus;
  fboLicenseNumber: string | null;
  fboLicenseVerified: boolean;
  manufacturerName: string;
  warningsJson: string[];
  shortSummary: string;
  editorialDescription: string;
  labelSummary: string;
  isDemoSeed: boolean;
  activeVariants?: Array<{
    sku: string;
    batchNumber: string;
    expiryDate: string;
  }>;
}

export interface GateViolation {
  code: string;
  field: string;
  message: string;
}

export interface PublishingGateVerdict {
  allowed: boolean;
  canAppearInPublicStore: boolean;
  violations: GateViolation[];
}

const PROHIBITED_AFFIRMATIVE_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern: /\b(?:fssai|fda)[\s-]+(?:approved|endorsed|certified)\b/i,
    reason:
      "Never imply FSSAI or FDA endorsement/approval of a supplement brand or SKU.",
  },
  {
    pattern: /\b(?:cures?|heals?|reverses?)\s+(?:diabetes|cancer|arthritis|fatty\s+liver|pcos|hypothyroidism|alzheimer|depression|insomnia)\b/i,
    reason:
      "Disease treatment/cure claims violate FSSAI Advertising & Claims Regulations, 2018.",
  },
  {
    pattern: /\b(?:liver\s+detox\s+cure|guaranteed\s+anti[-\s]?ageing|boosts?\s+testosterone|melts?\s+belly\s+fat|clinically\s+proven\s+to\s+cure)\b/i,
    reason:
      "Unsupported detox, hormone, weight-loss, or clinical-cure claims are prohibited.",
  },
];

export function validateClaimsCopy(textFields: {
  shortSummary: string;
  editorialDescription: string;
  labelSummary: string;
}): GateViolation[] {
  const violations: GateViolation[] = [];
  for (const [field, text] of Object.entries(textFields)) {
    for (const rule of PROHIBITED_AFFIRMATIVE_PATTERNS) {
      if (rule.pattern.test(text)) {
        violations.push({
          code: "PROHIBITED_CLAIM",
          field,
          message: rule.reason,
        });
      }
    }
  }
  return violations;
}

export function isValidFoscosLicenseNumber(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\d{14}$/.test(value.trim());
}

/**
 * Evaluates whether a SKU satisfies GOODFORM's India FSSAI Publishing Gate.
 * Pending legal, regulatory, botanical, and non-specified SKUs are strictly blocked.
 */
export function evaluateFssaiPublishingGate(
  sku: GateSkuCandidate,
  options?: {
    appEnv?: "development" | "test" | "demo" | "production";
    referenceDateIso?: string;
  },
): PublishingGateVerdict {
  const violations: GateViolation[] = [];
  const appEnv = options?.appEnv ?? "demo";
  const todayIso =
    options?.referenceDateIso ?? new Date().toISOString().slice(0, 10);

  if (sku.jurisdiction !== "IN") {
    violations.push({
      code: "JURISDICTION_MISMATCH",
      field: "jurisdiction",
      message: "Only India (IN) jurisdiction formulations may be published on GOODFORM.",
    });
  }

  // 1. Review state check
  if (
    sku.complianceReviewState === "PENDING_LEGAL_REVIEW" ||
    sku.complianceReviewState === "PENDING_REGULATORY_REVIEW" ||
    sku.complianceReviewState === "PENDING_BOTANICAL_REVIEW" ||
    sku.complianceReviewState === "PENDING_NON_SPECIFIED_REVIEW" ||
    sku.complianceReviewState === "REJECTED"
  ) {
    violations.push({
      code: "REVIEW_STATE_BLOCKED",
      field: "complianceReviewState",
      message: `SKU review state is ${sku.complianceReviewState}; pending/rejected formulations remain unpublished.`,
    });
  }

  // 2. Ingredient eligibility check
  if (sku.ingredientEligibilityState !== "ELIGIBLE_WITHIN_LIMITS") {
    violations.push({
      code: "INGREDIENT_NOT_CLEARED",
      field: "ingredientEligibilityState",
      message: `Ingredient eligibility is ${sku.ingredientEligibilityState}; non-cleared ingredients cannot be published.`,
    });
  }

  // 3. Shilajit / AYUSH, Botanicals, and Non-Specified categories require OWNER_VERIFIED + valid 14-digit FBO licence
  if (
    sku.fssaiCategory === "AYUSH_BORDERLINE" ||
    sku.fssaiCategory === "BOTANICAL_SPECIALTY" ||
    sku.fssaiCategory === "NON_SPECIFIED_FOOD"
  ) {
    if (
      sku.complianceReviewState !== "OWNER_VERIFIED" ||
      !sku.fboLicenseVerified ||
      !isValidFoscosLicenseNumber(sku.fboLicenseNumber)
    ) {
      violations.push({
        code: "SPECIAL_CATEGORY_EVIDENCE_REQUIRED",
        field: "fssaiCategory",
        message: `Category ${sku.fssaiCategory} stays unpublished until qualified India-specific review (OWNER_VERIFIED) and a verified 14-digit FoSCoS FBO licence are on file.`,
      });
    }
  }

  // 4. Commercial production requires owner-confirmed non-demo records + verified FBO licence
  if (appEnv === "production") {
    if (sku.isDemoSeed) {
      violations.push({
        code: "DEMO_SEED_IN_PRODUCTION",
        field: "isDemoSeed",
        message:
          "Demo seed SKU records cannot be sold in commercial production until owner-confirmed.",
      });
    }
    if (!sku.fboLicenseVerified || !isValidFoscosLicenseNumber(sku.fboLicenseNumber)) {
      violations.push({
        code: "FBO_LICENSE_REQUIRED_IN_PROD",
        field: "fboLicenseNumber",
        message:
          "A verified 14-digit FSSAI FoSCoS FBO licence number is required in commercial production.",
      });
    }
  }

  // 5. Mandatory FSSAI statutory warning statements
  const joinedWarnings = sku.warningsJson.join(" ").toLowerCase();
  if (!joinedWarnings.includes("not for medicinal use")) {
    violations.push({
      code: "MISSING_NOT_FOR_MEDICINAL_USE",
      field: "warningsJson",
      message:
        'Mandatory FSSAI statement "NOT FOR MEDICINAL USE" must appear in label warnings.',
    });
  }
  if (!joinedWarnings.includes("recommended daily usage")) {
    violations.push({
      code: "MISSING_DAILY_USAGE_WARNING",
      field: "warningsJson",
      message:
        'Mandatory warning "Not to exceed the stated recommended daily usage" is required.',
    });
  }

  if (!sku.manufacturerName || sku.manufacturerName.trim().length < 5) {
    violations.push({
      code: "MISSING_MANUFACTURER",
      field: "manufacturerName",
      message: "Manufacturer or packer/importer declaration is required.",
    });
  }

  // 6. Claims copy check
  violations.push(
    ...validateClaimsCopy({
      shortSummary: sku.shortSummary,
      editorialDescription: sku.editorialDescription,
      labelSummary: sku.labelSummary,
    }),
  );

  // 7. Batch & expiry check on active variants
  if (sku.activeVariants && sku.activeVariants.length > 0) {
    for (const v of sku.activeVariants) {
      if (!v.batchNumber || v.batchNumber.trim().length < 3) {
        violations.push({
          code: "MISSING_BATCH_NUMBER",
          field: "activeVariants.batchNumber",
          message: `Variant ${v.sku} is missing a valid batch number.`,
        });
      }
      if (!v.expiryDate || v.expiryDate <= todayIso) {
        violations.push({
          code: "EXPIRED_OR_INVALID_BATCH",
          field: "activeVariants.expiryDate",
          message: `Variant ${v.sku} batch ${v.batchNumber} is expired or missing a future expiry date (${v.expiryDate}).`,
        });
      }
    }
  }

  const allowed = violations.length === 0;
  return {
    allowed,
    canAppearInPublicStore: allowed && sku.publishStatus === "PUBLISHED",
    violations,
  };
}
