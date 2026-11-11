import { asc, eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import {
  products,
  productVariants,
  type ProductVariantRow,
  type ProductRow,
} from "@/db/schema/catalog-types";
import {
  evaluateFssaiPublishingGate,
  type PublishingGateVerdict,
} from "@/domain/compliance/fssai-gate";
import { getEffectiveAppEnv } from "@/env";

export type CatalogSort = "featured" | "price-asc" | "price-desc" | "name-asc";

export interface HydratedVariant extends ProductVariantRow {
  availableStock: number;
}

export interface HydratedProduct extends ProductRow {
  variants: HydratedVariant[];
  defaultVariant: HydratedVariant;
  startingPricePaise: number;
  totalAvailableStock: number;
  gateVerdict: PublishingGateVerdict;
}

export interface PublicCatalogQuery {
  q?: string;
  collection?: string;
  diet?: "VEGAN" | "VEGETARIAN" | "ALL";
  form?: string;
  inStockOnly?: boolean;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedCatalogResult {
  items: HydratedProduct[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  totalSeededSkus: number;
  heldUnpublishedCount: number;
}

function hydrateRows(
  allProducts: ProductRow[],
  allVariants: ProductVariantRow[],
): HydratedProduct[] {
  const appEnv = getEffectiveAppEnv();
  const variantsByProduct = new Map<string, HydratedVariant[]>();

  for (const v of allVariants) {
    if (!v.isActive) continue;
    const availableStock = Math.max(0, v.stockOnHand - v.stockReserved);
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push({ ...v, availableStock });
    variantsByProduct.set(v.productId, list);
  }

  const result: HydratedProduct[] = [];
  for (const p of allProducts) {
    const vars = (variantsByProduct.get(p.id) ?? []).sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.pricePaise - b.pricePaise;
    });
    const fallbackVar: HydratedVariant = vars[0] ?? {
      id: `fallback_${p.id}`,
      productId: p.id,
      sku: p.sku,
      title: p.netQuantityLabel,
      packLabel: p.netQuantityLabel,
      servingsCount: p.servingsPerPack,
      pricePaise: 0,
      gstRateBps: 1800,
      weightGrams: 180,
      stockOnHand: 0,
      stockReserved: 0,
      availableStock: 0,
      batchNumber: "UNASSIGNED",
      manufacturedDate: "2026-10-01",
      expiryDate: "2027-10-01",
      isDefault: true,
      isActive: false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    const startingPricePaise = vars.reduce(
      (min, v) => (v.pricePaise < min ? v.pricePaise : min),
      fallbackVar.pricePaise,
    );
    const totalAvailableStock = vars.reduce(
      (sum, v) => sum + v.availableStock,
      0,
    );

    const gateVerdict = evaluateFssaiPublishingGate(
      {
        slug: p.slug,
        name: p.name,
        jurisdiction: p.jurisdiction,
        fssaiCategory: p.fssaiCategory,
        ingredientEligibilityState: p.ingredientEligibilityState,
        complianceReviewState: p.complianceReviewState,
        publishStatus: p.publishStatus,
        fboLicenseNumber: p.fboLicenseNumber,
        fboLicenseVerified: p.fboLicenseVerified,
        manufacturerName: p.manufacturerName,
        warningsJson: p.warningsJson,
        shortSummary: p.shortSummary,
        editorialDescription: p.editorialDescription,
        labelSummary: p.labelSummary,
        isDemoSeed: p.isDemoSeed,
        activeVariants: vars.map((v) => ({
          sku: v.sku,
          batchNumber: v.batchNumber,
          expiryDate: v.expiryDate,
        })),
      },
      // Note: On demo preview deployments we pass appEnv as configured; in commercial prod demo seeds block automatically.
      { appEnv: appEnv === "production" ? "production" : "demo" },
    );

    result.push({
      ...p,
      variants: vars,
      defaultVariant: fallbackVar,
      startingPricePaise,
      totalAvailableStock,
      gateVerdict,
    });
  }

  return result;
}

export async function loadAllHydratedProducts(
  dbOverride?: Database,
): Promise<HydratedProduct[]> {
  const db = dbOverride ?? (await getDb());
  const [allProducts, allVariants] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sku)),
    db.select().from(productVariants).orderBy(asc(productVariants.pricePaise)),
  ]);
  return hydrateRows(allProducts, allVariants);
}

export async function listPublicCatalog(
  query: PublicCatalogQuery = {},
  dbOverride?: Database,
): Promise<PaginatedCatalogResult> {
  const all = await loadAllHydratedProducts(dbOverride);
  const published = all.filter((p) => p.gateVerdict.canAppearInPublicStore);
  const heldUnpublishedCount = all.length - published.length;

  let filtered = published;

  if (query.collection && query.collection !== "all") {
    const col = query.collection.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.primaryCollection === col || p.collectionSlugs.includes(col),
    );
  }

  if (query.diet === "VEGAN") {
    filtered = filtered.filter((p) => p.dietType === "VEGAN");
  } else if (query.diet === "VEGETARIAN") {
    filtered = filtered.filter(
      (p) => p.dietType === "VEGAN" || p.dietType === "VEGETARIAN",
    );
  }

  if (query.form && query.form !== "ALL") {
    filtered = filtered.filter((p) => p.supplementForm === query.form);
  }

  if (query.inStockOnly) {
    filtered = filtered.filter((p) => p.totalAvailableStock > 0);
  }

  if (query.q && query.q.trim().length > 0) {
    const needle = query.q.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const ingredientMatch = p.ingredientsJson.some(
        (ing) =>
          ing.name.toLowerCase().includes(needle) ||
          ing.compoundForm.toLowerCase().includes(needle),
      );
      return (
        p.name.toLowerCase().includes(needle) ||
        p.subtitle.toLowerCase().includes(needle) ||
        p.shortSummary.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        p.primaryCollection.toLowerCase().includes(needle) ||
        ingredientMatch
      );
    });
  }

  const sort = query.sort ?? "featured";
  filtered = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.startingPricePaise - b.startingPricePaise;
    if (sort === "price-desc") return b.startingPricePaise - a.startingPricePaise;
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    // featured
    if (a.isFlagship !== b.isFlagship) return a.isFlagship ? -1 : 1;
    const ra = a.featuredRank ?? 999;
    const rb = b.featuredRank ?? 999;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });

  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(totalPages, Math.max(1, query.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    totalItems,
    totalPages,
    page,
    pageSize,
    totalSeededSkus: all.length,
    heldUnpublishedCount,
  };
}

export async function getPublicProductBySlug(
  slug: string,
  dbOverride?: Database,
): Promise<HydratedProduct | null> {
  const all = await loadAllHydratedProducts(dbOverride);
  const found = all.find((p) => p.slug === slug);
  if (!found || !found.gateVerdict.canAppearInPublicStore) {
    return null;
  }
  return found;
}

export async function getAnyProductBySlug(
  slug: string,
  dbOverride?: Database,
): Promise<HydratedProduct | null> {
  const all = await loadAllHydratedProducts(dbOverride);
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedHomeProducts(
  limit = 8,
  dbOverride?: Database,
): Promise<{
  flagship: HydratedProduct | null;
  featured: HydratedProduct[];
  totalSeededCount: number;
  publishedCount: number;
  heldProducts: Array<{
    name: string;
    slug: string;
    complianceReviewState: string;
    holdReason: string | null;
  }>;
}> {
  const all = await loadAllHydratedProducts(dbOverride);
  const published = all
    .filter((p) => p.gateVerdict.canAppearInPublicStore)
    .sort((a, b) => {
      if (a.isFlagship !== b.isFlagship) return a.isFlagship ? -1 : 1;
      return (a.featuredRank ?? 999) - (b.featuredRank ?? 999);
    });

  const flagship = published.find((p) => p.isFlagship) ?? published[0] ?? null;
  const featured = published.slice(0, limit);
  const heldProducts = all
    .filter((p) => !p.gateVerdict.canAppearInPublicStore)
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      complianceReviewState: p.complianceReviewState,
      holdReason: p.holdReason,
    }));

  return {
    flagship,
    featured,
    totalSeededCount: all.length,
    publishedCount: published.length,
    heldProducts,
  };
}

export async function getProductByIdForAdmin(
  id: string,
  dbOverride?: Database,
): Promise<HydratedProduct | null> {
  const db = dbOverride ?? (await getDb());
  const [prod] = await db.select().from(products).where(eq(products.id, id));
  if (!prod) return null;
  const vars = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id));
  return hydrateRows([prod], vars)[0] ?? null;
}
