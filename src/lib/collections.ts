export type CollectionSlug =
  | "foundations"
  | "omega"
  | "gut"
  | "beauty"
  | "sleep"
  | "active"
  | "vitamins"
  | "antioxidants";

export interface CollectionDefinition {
  slug: CollectionSlug;
  name: string;
  eyebrow: string;
  shortDescription: string;
  editorialIntro: string;
  routineWindow: string;
  accentTone: "persimmon" | "lilac" | "aubergine" | "verbena" | "amber";
}

export const COLLECTIONS: readonly CollectionDefinition[] = [
  {
    slug: "foundations",
    name: "Foundations",
    eyebrow: "Daily Mineral & Micronutrient Base",
    shortDescription:
      "Chelated minerals and balanced daily multis with full elemental weight printed on the front panel.",
    editorialIntro:
      "Everyday baseline inputs built around chelated magnesium, zinc, iron, calcium, and a sensible two-capsule daily multivitamin.",
    routineWindow: "Morning or evening with meals",
    accentTone: "aubergine",
  },
  {
    slug: "omega",
    name: "Omega",
    eyebrow: "EPA & DHA Fatty Acids",
    shortDescription:
      "Concentrated triglyceride fish oil and microalgae DHA/EPA options for omnivore and plant-based routines.",
    editorialIntro:
      "Essential long-chain fatty acids standardized for actual EPA and DHA milligrams rather than vague total marine lipid weight.",
    routineWindow: "With your main fat-containing meal",
    accentTone: "persimmon",
  },
  {
    slug: "gut",
    name: "Gut",
    eyebrow: "Fibre, Cultures & Digestive Enzymes",
    shortDescription:
      "Named-strain probiotics, gentle soluble fibres, and mealtime enzyme blends without 'detox' theatre.",
    editorialIntro:
      "Measured CFU counts at expiry, gentle psyllium and chicory inulin fibres, and multi-substrate digestive enzymes.",
    routineWindow: "Before meals or with morning water",
    accentTone: "verbena",
  },
  {
    slug: "beauty",
    name: "Beauty",
    eyebrow: "Structural Proteins & Micronutrients",
    shortDescription:
      "Hydrolysed bovine and marine collagen peptides, hyaluronic acid, and biotin with lab-test cautions.",
    editorialIntro:
      "Neutral-tasting collagen peptides and targeted B-vitamin/mineral cofactors with honest structural nutrition copy.",
    routineWindow: "Stirred into morning coffee, water, or breakfast",
    accentTone: "lilac",
  },
  {
    slug: "sleep",
    name: "Sleep",
    eyebrow: "Evening Wind-Down Inputs",
    shortDescription:
      "Non-melatonin evening amino acid and chelated magnesium options for unhurried night routines.",
    editorialIntro:
      "Calm, non-sedating evening nutrition built around pure glycine powder and unbuffered magnesium bisglycinate.",
    routineWindow: "45 to 60 minutes before bed",
    accentTone: "lilac",
  },
  {
    slug: "active",
    name: "Active",
    eyebrow: "Strength, Protein & Hydration",
    shortDescription:
      "Micronised creatine monohydrate, isolate and plant proteins, balanced electrolytes, joint cofactors, and beetroot.",
    editorialIntro:
      "Clean training and movement staples measured per scoop with zero proprietary blends or amino spiking.",
    routineWindow: "Pre/post training or daily anytime",
    accentTone: "persimmon",
  },
  {
    slug: "vitamins",
    name: "Vitamins",
    eyebrow: "Single & Paired Essential Vitamins",
    shortDescription:
      "Lichen and cholecalciferol D3, MK-7 K2, methylated B-vitamins, and buffered/liposomal Vitamin C.",
    editorialIntro:
      "Targeted single-vitamin and synergistic D3 + K2 formulations calibrated to Indian ICMR-NIN daily reference intakes.",
    routineWindow: "Morning with breakfast",
    accentTone: "amber",
  },
  {
    slug: "antioxidants",
    name: "Antioxidants",
    eyebrow: "Cellular Redox & Lipid Cofactors",
    shortDescription:
      "Flagship Liposomal Glutathione and ubiquinol/CoQ10 formulated without exaggerated anti-ageing claims.",
    editorialIntro:
      "Phospholipid-encapsulated glutathione and fat-soluble ubiquinol cofactors with strict FSSAI nutraceutical labelling.",
    routineWindow: "Morning with water or food per label",
    accentTone: "aubergine",
  },
] as const;

export function getCollectionBySlug(
  slug: string,
): CollectionDefinition | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
