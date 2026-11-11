import type {
  ComplianceReviewState,
  FssaiCategory,
  IngredientEligibilityState,
  IngredientLine,
  PublishStatus,
  SupplementForm,
} from "@/db/schema/catalog";
import type { CollectionSlug } from "@/lib/collections";

export interface SeedVariantInput {
  id: string;
  sku: string;
  title: string;
  packLabel: string;
  servingsCount: number;
  pricePaise: number;
  gstRateBps?: number;
  weightGrams: number;
  stockOnHand: number;
  batchNumber: string;
  manufacturedDate: string;
  expiryDate: string;
  isDefault: boolean;
}

export interface SeedProductInput {
  id: string;
  sku: string;
  slug: string;
  name: string;
  subtitle: string;
  shortSummary: string;
  editorialDescription: string;
  primaryCollection: CollectionSlug;
  collectionSlugs: CollectionSlug[];
  supplementForm: SupplementForm;
  servingSizeLabel: string;
  servingsPerPack: number;
  netQuantityLabel: string;
  ingredients: IngredientLine[];
  otherIngredients: string;
  dietType: "VEGAN" | "VEGETARIAN" | "NON_VEGETARIAN";
  allergenFlags: string[];
  labelSummary: string;
  directionsForUse: string;
  warnings: string[];
  storageInstructions: string;
  imagePath: string;
  macroImagePath?: string;
  isFlagship?: boolean;
  featuredRank?: number;
  marketSignalBadge?: string;
  marketSignalSourceUrl?: string;
  routineTags: string[];
  fssaiCategory: FssaiCategory;
  ingredientEligibilityState: IngredientEligibilityState;
  complianceReviewState: ComplianceReviewState;
  publishStatus: PublishStatus;
  holdReason?: string;
  manufacturerName: string;
  countryOfOrigin?: string;
  variants: SeedVariantInput[];
}

export const STANDARD_FSSAI_WARNINGS = [
  "NOT FOR MEDICINAL USE.",
  "Not to exceed the stated recommended daily usage.",
  "This product is not intended to diagnose, treat, cure, or prevent any disease.",
  "Keep out of reach of children.",
  "Consult a qualified healthcare professional before use if pregnant, nursing, taking medication, or managing a medical condition.",
] as const;

export const DEMO_MANUFACTURER =
  "Goodform Formulation Partner Unit II, MIDC Taloja, Navi Mumbai, MH (Demo Seed Record)";
