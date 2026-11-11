import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type SupplementForm =
  | "CAPSULE"
  | "SOFTGEL"
  | "TABLET"
  | "POWDER"
  | "LIQUID_SACHET"
  | "RESIN";

export type FssaiCategory =
  | "HEALTH_SUPPLEMENT"
  | "NUTRACEUTICAL"
  | "PROBIOTIC_FOOD"
  | "PREBIOTIC_FOOD"
  | "FSDU"
  | "BOTANICAL_SPECIALTY"
  | "NON_SPECIFIED_FOOD"
  | "AYUSH_BORDERLINE";

export type IngredientEligibilityState =
  | "ELIGIBLE_WITHIN_LIMITS"
  | "PENDING_SCHEDULE_IV_BOTANICAL"
  | "PENDING_NON_SPECIFIED_APPROVAL"
  | "PENDING_LEGAL_CLASSIFICATION"
  | "PENDING_REGULATORY_REVIEW"
  | "BLOCKED";

export type ComplianceReviewState =
  | "APPROVED_DEMO_SEED"
  | "PENDING_LEGAL_REVIEW"
  | "PENDING_REGULATORY_REVIEW"
  | "PENDING_BOTANICAL_REVIEW"
  | "PENDING_NON_SPECIFIED_REVIEW"
  | "OWNER_VERIFIED"
  | "REJECTED";

export type PublishStatus =
  | "PUBLISHED"
  | "UNPUBLISHED_HOLD"
  | "DRAFT"
  | "ARCHIVED";

export type NutrientOverlapKey =
  | "vitamin_d_iu"
  | "vitamin_b12_mcg"
  | "folate_mcg"
  | "biotin_mcg"
  | "vitamin_c_mg"
  | "vitamin_k2_mcg"
  | "magnesium_mg"
  | "zinc_mg"
  | "iron_mg"
  | "calcium_mg"
  | "selenium_mcg"
  | "copper_mg"
  | "epa_dha_mg"
  | "creatine_g"
  | "protein_g"
  | "collagen_g"
  | "glutathione_mg"
  | "coq10_mg";

export interface IngredientLine {
  name: string;
  compoundForm: string;
  amountDisplay: string;
  overlapKey?: NutrientOverlapKey;
  overlapNumericAmount?: number;
  rdaPercentIndia?: string | null;
  note?: string;
}

export interface OwnerEvidenceRecord {
  coaUrl: string | null;
  labTestingVerified: boolean;
  gmpVerified: boolean;
  notes: string;
}

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    subtitle: text("subtitle").notNull(),
    shortSummary: text("short_summary").notNull(),
    editorialDescription: text("editorial_description").notNull(),
    primaryCollection: text("primary_collection").notNull(),
    collectionSlugs: jsonb("collection_slugs")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    supplementForm: text("supplement_form").$type<SupplementForm>().notNull(),
    servingSizeLabel: text("serving_size_label").notNull(),
    servingsPerPack: integer("servings_per_pack").notNull(),
    netQuantityLabel: text("net_quantity_label").notNull(),
    ingredientsJson: jsonb("ingredients_json")
      .$type<IngredientLine[]>()
      .notNull(),
    otherIngredients: text("other_ingredients").notNull(),
    dietType: text("diet_type")
      .$type<"VEGAN" | "VEGETARIAN" | "NON_VEGETARIAN">()
      .notNull(),
    allergenFlags: jsonb("allergen_flags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    labelSummary: text("label_summary").notNull(),
    directionsForUse: text("directions_for_use").notNull(),
    warningsJson: jsonb("warnings_json").$type<string[]>().notNull(),
    storageInstructions: text("storage_instructions").notNull(),
    imagePath: text("image_path").notNull(),
    macroImagePath: text("macro_image_path"),
    isFlagship: boolean("is_flagship").notNull().default(false),
    featuredRank: integer("featured_rank"),
    marketSignalBadge: text("market_signal_badge"),
    marketSignalSourceUrl: text("market_signal_source_url"),
    routineTags: jsonb("routine_tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    // FSSAI / India Publishing Gate fields
    fssaiCategory: text("fssai_category").$type<FssaiCategory>().notNull(),
    ingredientEligibilityState: text("ingredient_eligibility_state")
      .$type<IngredientEligibilityState>()
      .notNull(),
    complianceReviewState: text("compliance_review_state")
      .$type<ComplianceReviewState>()
      .notNull(),
    publishStatus: text("publish_status")
      .$type<PublishStatus>()
      .notNull()
      .default("UNPUBLISHED_HOLD"),
    holdReason: text("hold_reason"),
    jurisdiction: text("jurisdiction").notNull().default("IN"),
    fboLicenseNumber: text("fbo_license_number"),
    fboLicenseVerified: boolean("fbo_license_verified")
      .notNull()
      .default(false),
    manufacturerName: text("manufacturer_name").notNull(),
    importerDetails: text("importer_details"),
    countryOfOrigin: text("country_of_origin").notNull().default("India"),
    ownerEvidenceJson: jsonb("owner_evidence_json")
      .$type<OwnerEvidenceRecord>()
      .notNull(),
    isDemoSeed: boolean("is_demo_seed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_products_primary_collection").on(t.primaryCollection),
    index("idx_products_publish_status").on(t.publishStatus),
    index("idx_products_featured_rank").on(t.featuredRank),
    check("chk_products_servings_pos", sql`${t.servingsPerPack} > 0`),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    title: text("title").notNull(),
    packLabel: text("pack_label").notNull(),
    servingsCount: integer("servings_count").notNull(),
    pricePaise: integer("price_paise").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull().default(1800),
    weightGrams: integer("weight_grams").notNull().default(180),
    stockOnHand: integer("stock_on_hand").notNull().default(0),
    stockReserved: integer("stock_reserved").notNull().default(0),
    batchNumber: text("batch_number").notNull(),
    manufacturedDate: text("manufactured_date").notNull(),
    expiryDate: text("expiry_date").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_variants_product_id").on(t.productId),
    check("chk_variants_price_nonneg", sql`${t.pricePaise} >= 0`),
    check("chk_variants_stock_nonneg", sql`${t.stockOnHand} >= 0`),
    check("chk_variants_reserved_nonneg", sql`${t.stockReserved} >= 0`),
    check("chk_variants_servings_pos", sql`${t.servingsCount} > 0`),
  ],
);
