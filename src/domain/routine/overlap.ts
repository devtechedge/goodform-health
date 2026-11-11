import type { NutrientOverlapKey, IngredientLine } from "@/db/schema/catalog";

export type RoutineDietPreference = "OMNIVORE" | "VEGETARIAN" | "VEGAN";
export type RoutineFormatPreference =
  | "EITHER"
  | "CAPSULES_SOFTGELS"
  | "POWDERS_SACHETS";
export type RoutineFocusTag =
  | "morning-foundations"
  | "indoor-daylight"
  | "training-hydration"
  | "evening-wind-down"
  | "gut-comfort"
  | "beauty-structure"
  | "antioxidant-support";

export interface RoutinePreferences {
  diet: RoutineDietPreference;
  format: RoutineFormatPreference;
  focusAreas: RoutineFocusTag[];
}

export interface RoutineCandidateProduct {
  id: string;
  slug: string;
  name: string;
  supplementForm: string;
  dietType: "VEGAN" | "VEGETARIAN" | "NON_VEGETARIAN";
  routineTags: string[];
  servingsPerPack: number;
  startingPricePaise: number;
  defaultVariantId: string;
  ingredientsJson: IngredientLine[];
}

export interface NutrientOverlapCaution {
  key: NutrientOverlapKey;
  nutrientLabel: string;
  unit: string;
  totalAmount: number;
  referenceThreshold: number | null;
  severity: "OVERLAP_NOTICE" | "EXCEEDS_DAILY_REFERENCE";
  contributors: Array<{ slug: string; name: string; amount: number }>;
  guidance: string;
}

export interface RoutineAnalysis {
  totalPackPricePaise: number;
  estimatedDailyCostPaise: number;
  nutrientTotals: Array<{
    key: NutrientOverlapKey;
    label: string;
    unit: string;
    total: number;
    contributors: string[];
  }>;
  cautions: NutrientOverlapCaution[];
}

const NUTRIENT_META: Record<
  NutrientOverlapKey,
  {
    label: string;
    unit: string;
    dailyReferenceLimit: number | null;
    limitExplanation: string;
  }
> = {
  vitamin_d_iu: {
    label: "Vitamin D3 (Cholecalciferol)",
    unit: "IU",
    dailyReferenceLimit: 600,
    limitExplanation:
      "ICMR-NIN adult daily supplemental RDA is 600 IU (15 mcg). Avoid stacking multiple Vitamin D products unless advised by your physician based on blood work.",
  },
  vitamin_b12_mcg: {
    label: "Vitamin B12",
    unit: "mcg",
    dailyReferenceLimit: 2.2,
    limitExplanation:
      "ICMR-NIN adult daily RDA is 2.2 mcg. Stacking a Daily Multivitamin, B-Complex, and standalone B12 duplicates cobalamin intake.",
  },
  folate_mcg: {
    label: "Folate (5-MTHF)",
    unit: "mcg DFE",
    dailyReferenceLimit: 300,
    limitExplanation:
      "ICMR-NIN adult daily RDA is 300 mcg DFE; check overlapping multivitamin and B-complex capsules.",
  },
  biotin_mcg: {
    label: "D-Biotin (Vitamin B7)",
    unit: "mcg",
    dailyReferenceLimit: 40,
    limitExplanation:
      "Cumulative biotin above 40 mcg duplicates B7 intake and should always be disclosed prior to thyroid or cardiac troponin blood panels.",
  },
  vitamin_c_mg: {
    label: "Vitamin C",
    unit: "mg",
    dailyReferenceLimit: 1000,
    limitExplanation:
      "Cumulative supplemental Vitamin C above 1,000 mg/day increases unabsorbed intestinal ascorbate and urinary oxalate load.",
  },
  vitamin_k2_mcg: {
    label: "Vitamin K2 (MK-7)",
    unit: "mcg",
    dailyReferenceLimit: 55,
    limitExplanation:
      "ICMR-NIN adult Vitamin K reference is 55 mcg; consult a physician if taking anticoagulant medication.",
  },
  magnesium_mg: {
    label: "Elemental Magnesium",
    unit: "mg",
    dailyReferenceLimit: 350,
    limitExplanation:
      "Supplemental elemental magnesium above ~350 mg/day across combined salts may cause mild osmotic GI looseness.",
  },
  zinc_mg: {
    label: "Elemental Zinc",
    unit: "mg",
    dailyReferenceLimit: 17,
    limitExplanation:
      "ICMR-NIN adult male RDA is 17 mg (13.2 mg women); stacking multiple zinc formulas long-term can compete with copper absorption.",
  },
  iron_mg: {
    label: "Elemental Iron",
    unit: "mg",
    dailyReferenceLimit: 19,
    limitExplanation:
      "Supplemental iron should not be stacked unless directed by a clinician following ferritin/haemoglobin testing.",
  },
  calcium_mg: {
    label: "Elemental Calcium",
    unit: "mg",
    dailyReferenceLimit: 1000,
    limitExplanation:
      "Space supplemental calcium away from iron capsules by at least 2 hours so they do not compete for absorption.",
  },
  selenium_mcg: {
    label: "Selenium",
    unit: "mcg",
    dailyReferenceLimit: 40,
    limitExplanation:
      "ICMR-NIN daily selenium reference is 40 mcg; avoid combining multiple selenium-containing formulas unnecessarily.",
  },
  copper_mg: {
    label: "Elemental Copper",
    unit: "mg",
    dailyReferenceLimit: 1.7,
    limitExplanation: "ICMR-NIN adult copper reference is 1.7 mg/day.",
  },
  epa_dha_mg: {
    label: "Combined Omega-3 (EPA + DHA)",
    unit: "mg",
    dailyReferenceLimit: 1500,
    limitExplanation:
      "Usually choose either Triple-Strength Fish Oil or Vegan Algal Omega-3 rather than combining both.",
  },
  creatine_g: {
    label: "Creatine Monohydrate",
    unit: "g",
    dailyReferenceLimit: 5,
    limitExplanation: "3 to 5 g daily maintenance is sufficient for adults.",
  },
  protein_g: {
    label: "Supplemental Protein",
    unit: "g",
    dailyReferenceLimit: 60,
    limitExplanation:
      "Balance supplemental scoops with whole-food dals, dairy, eggs, or legumes across the day.",
  },
  collagen_g: {
    label: "Collagen Peptides",
    unit: "g",
    dailyReferenceLimit: 15,
    limitExplanation:
      "Choose either Bovine Collagen Peptides or Marine Collagen + HA rather than duplicating both.",
  },
  glutathione_mg: {
    label: "Reduced L-Glutathione",
    unit: "mg",
    dailyReferenceLimit: 250,
    limitExplanation: "Single flagship serving provides 250 mg reduced GSH.",
  },
  coq10_mg: {
    label: "Ubiquinol / CoQ10",
    unit: "mg",
    dailyReferenceLimit: 200,
    limitExplanation: "Standard daily nutraceutical range is 100 to 200 mg.",
  },
};

export function analyzeRoutineSelection(
  selected: RoutineCandidateProduct[],
): RoutineAnalysis {
  let totalPackPricePaise = 0;
  let estimatedDailyCostPaise = 0;

  const accumulator = new Map<
    NutrientOverlapKey,
    Array<{ slug: string; name: string; amount: number }>
  >();

  for (const p of selected) {
    totalPackPricePaise += p.startingPricePaise;
    const perDay = Math.round(
      p.startingPricePaise / Math.max(1, p.servingsPerPack),
    );
    estimatedDailyCostPaise += perDay;

    // Sum per-product contribution per overlapKey first (e.g. EPA + DHA lines in same Omega SKU)
    const perProductTotals = new Map<NutrientOverlapKey, number>();
    for (const ing of p.ingredientsJson) {
      if (ing.overlapKey && typeof ing.overlapNumericAmount === "number") {
        perProductTotals.set(
          ing.overlapKey,
          (perProductTotals.get(ing.overlapKey) ?? 0) + ing.overlapNumericAmount,
        );
      }
    }

    for (const [key, amount] of perProductTotals.entries()) {
      const list = accumulator.get(key) ?? [];
      list.push({ slug: p.slug, name: p.name, amount });
      accumulator.set(key, list);
    }
  }

  const nutrientTotals: RoutineAnalysis["nutrientTotals"] = [];
  const cautions: NutrientOverlapCaution[] = [];

  for (const [key, contributors] of accumulator.entries()) {
    const meta = NUTRIENT_META[key];
    const total = Number(
      contributors.reduce((s, c) => s + c.amount, 0).toFixed(2),
    );
    nutrientTotals.push({
      key,
      label: meta.label,
      unit: meta.unit,
      total,
      contributors: contributors.map((c) => c.name),
    });

    const exceedsLimit =
      meta.dailyReferenceLimit !== null && total > meta.dailyReferenceLimit;
    const hasMultipleContributors = contributors.length >= 2;

    if (exceedsLimit || hasMultipleContributors) {
      cautions.push({
        key,
        nutrientLabel: meta.label,
        unit: meta.unit,
        totalAmount: total,
        referenceThreshold: meta.dailyReferenceLimit,
        severity: exceedsLimit ? "EXCEEDS_DAILY_REFERENCE" : "OVERLAP_NOTICE",
        contributors,
        guidance: meta.limitExplanation,
      });
    }
  }

  // Also detect Iron + Calcium co-selection absorption timing note
  const hasIron = accumulator.has("iron_mg");
  const hasCalcium = accumulator.has("calcium_mg");
  if (hasIron && hasCalcium) {
    const caCaution = cautions.find((c) => c.key === "calcium_mg");
    if (!caCaution) {
      cautions.push({
        key: "calcium_mg",
        nutrientLabel: "Calcium & Iron Timing Interaction",
        unit: "mg",
        totalAmount:
          accumulator.get("calcium_mg")?.reduce((s, c) => s + c.amount, 0) ?? 0,
        referenceThreshold: null,
        severity: "OVERLAP_NOTICE",
        contributors: [
          ...(accumulator.get("calcium_mg") ?? []),
          ...(accumulator.get("iron_mg") ?? []),
        ],
        guidance:
          "Calcium competes with non-heme iron uptake when swallowed at the same meal. Take Iron Bisglycinate and Calcium Citrate + D3 at least 2 hours apart.",
      });
    }
  }

  cautions.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "EXCEEDS_DAILY_REFERENCE" ? -1 : 1;
    }
    return a.nutrientLabel.localeCompare(b.nutrientLabel);
  });

  return {
    totalPackPricePaise,
    estimatedDailyCostPaise,
    nutrientTotals,
    cautions,
  };
}

export function recommendRoutineProducts(
  catalog: RoutineCandidateProduct[],
  prefs: RoutinePreferences,
  maxItems = 4,
): RoutineCandidateProduct[] {
  const eligible = catalog.filter((p) => {
    if (prefs.diet === "VEGAN" && p.dietType !== "VEGAN") return false;
    if (
      prefs.diet === "VEGETARIAN" &&
      p.dietType === "NON_VEGETARIAN"
    ) {
      return false;
    }
    if (prefs.format === "CAPSULES_SOFTGELS") {
      return (
        p.supplementForm === "CAPSULE" ||
        p.supplementForm === "SOFTGEL" ||
        p.supplementForm === "TABLET"
      );
    }
    if (prefs.format === "POWDERS_SACHETS") {
      return (
        p.supplementForm === "POWDER" || p.supplementForm === "LIQUID_SACHET"
      );
    }
    return true;
  });

  const activeFocus =
    prefs.focusAreas.length > 0
      ? prefs.focusAreas
      : (["morning-foundations", "indoor-daylight"] as RoutineFocusTag[]);

  const scored = eligible
    .map((p) => {
      let score = 0;
      for (const tag of activeFocus) {
        if (p.routineTags.includes(tag)) score += 3;
      }
      if (p.slug === "magnesium-glycinate") score += 1.5;
      if (p.slug === "vitamin-d3-k2-mk7") score += 1.4;
      if (p.slug === "vegan-algal-omega-3" && prefs.diet !== "OMNIVORE") {
        score += 1.6;
      }
      if (
        p.slug === "triple-strength-omega-3-fish-oil" &&
        prefs.diet === "OMNIVORE"
      ) {
        score += 1.6;
      }
      return { product: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Avoid auto-picking two Vitamin D or two Omega SKUs in the initial recommendation
  const chosen: RoutineCandidateProduct[] = [];
  const usedPrimaryNutrient = new Set<string>();

  for (const { product } of scored) {
    if (chosen.length >= maxItems) break;
    const keys = product.ingredientsJson
      .map((i) => i.overlapKey)
      .filter((k): k is NutrientOverlapKey => Boolean(k));
    const collides = keys.some(
      (k) =>
        (k === "vitamin_d_iu" || k === "epa_dha_mg" || k === "biotin_mcg") &&
        usedPrimaryNutrient.has(k),
    );
    if (collides) continue;
    chosen.push(product);
    for (const k of keys) usedPrimaryNutrient.add(k);
  }

  return chosen;
}

export function parseShareableRoutineSlugs(
  rawParam: string | null | undefined,
  allowedSlugs: ReadonlySet<string>,
): string[] {
  if (!rawParam) return [];
  const parts = rawParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]{2,64}$/.test(s) && allowedSlugs.has(s));
  return Array.from(new Set(parts)).slice(0, 8);
}
