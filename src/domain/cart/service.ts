import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb, type Database, type DbExecutor } from "@/db/client";
import { products, productVariants } from "@/db/schema/catalog";
import { cartItems, carts } from "@/db/schema/commerce";
import { storeSettings } from "@/db/schema/content";
import { evaluateFssaiPublishingGate } from "@/domain/compliance/fssai-gate";
import { validateCouponInDb } from "@/domain/pricing/coupons";
import {
  computeOrderPricing,
  type OrderPricingBreakdown,
} from "@/domain/pricing/totals";
import { getEffectiveAppEnv } from "@/env";

export const MAX_QTY_PER_LINE = 12;

export interface CartOwner {
  userId?: string;
  guestTokenHash?: string;
}

export interface HydratedCartLine {
  itemId: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  sku: string;
  variantTitle: string;
  imagePath: string;
  unitPricePaise: number;
  gstRateBps: number;
  quantity: number;
  lineTotalPaise: number;
  availableStock: number;
  batchNumber: string;
  expiryDate: string;
}

export interface HydratedCartView {
  cartId: string | null;
  items: HydratedCartLine[];
  totalItemCount: number;
  appliedCouponCode: string | null;
  couponDescription: string | null;
  couponMessage: string | null;
  pricing: OrderPricingBreakdown;
}

async function loadShippingConfig(
  destinationStateCode?: string,
  dbOverride?: DbExecutor,
) {
  const db = dbOverride ?? (await getDb());
  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.id, "default"));
  return {
    freeShippingThresholdPaise: settings?.freeShippingThresholdPaise ?? 99900,
    standardShippingPaise: settings?.standardShippingPaise ?? 7900,
    dispatchStateCode: settings?.dispatchStateCode ?? "MH",
    destinationStateCode,
  };
}

export async function findOrCreateCart(
  owner: CartOwner,
  dbOverride?: DbExecutor,
) {
  const db = dbOverride ?? (await getDb());
  if (owner.userId) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, owner.userId));
    if (existing) return existing;
    const id = `crt_${randomBytes(12).toString("hex")}`;
    const [created] = await db
      .insert(carts)
      .values({ id, userId: owner.userId })
      .returning();
    return created!;
  }

  if (owner.guestTokenHash) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.guestTokenHash, owner.guestTokenHash));
    if (existing) return existing;
    const id = `crt_${randomBytes(12).toString("hex")}`;
    const [created] = await db
      .insert(carts)
      .values({ id, guestTokenHash: owner.guestTokenHash })
      .returning();
    return created!;
  }

  throw new Error("CartOwner requires userId or guestTokenHash.");
}

async function verifyVariantPurchasable(
  variantId: string,
  db: DbExecutor,
): Promise<{
  variant: typeof productVariants.$inferSelect;
  product: typeof products.$inferSelect;
  availableStock: number;
}> {
  const [row] = await db
    .select({
      variant: productVariants,
      product: products,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, variantId));

  if (!row || !row.variant.isActive) {
    throw new CartDomainError("VARIANT_NOT_FOUND", "Selected pack variant was not found.");
  }

  const appEnv = getEffectiveAppEnv();
  const verdict = evaluateFssaiPublishingGate(
    {
      slug: row.product.slug,
      name: row.product.name,
      jurisdiction: row.product.jurisdiction,
      fssaiCategory: row.product.fssaiCategory,
      ingredientEligibilityState: row.product.ingredientEligibilityState,
      complianceReviewState: row.product.complianceReviewState,
      publishStatus: row.product.publishStatus,
      fboLicenseNumber: row.product.fboLicenseNumber,
      fboLicenseVerified: row.product.fboLicenseVerified,
      manufacturerName: row.product.manufacturerName,
      warningsJson: row.product.warningsJson,
      shortSummary: row.product.shortSummary,
      editorialDescription: row.product.editorialDescription,
      labelSummary: row.product.labelSummary,
      isDemoSeed: row.product.isDemoSeed,
      activeVariants: [
        {
          sku: row.variant.sku,
          batchNumber: row.variant.batchNumber,
          expiryDate: row.variant.expiryDate,
        },
      ],
    },
    { appEnv: appEnv === "production" ? "production" : "demo" },
  );

  if (!verdict.canAppearInPublicStore) {
    throw new CartDomainError(
      "SKU_COMPLIANCE_BLOCKED",
      `${row.product.name} is withheld from sale under GOODFORM's India FSSAI publishing gate.`,
    );
  }

  const availableStock = Math.max(
    0,
    row.variant.stockOnHand - row.variant.stockReserved,
  );
  return { variant: row.variant, product: row.product, availableStock };
}

export class CartDomainError extends Error {
  constructor(
    public readonly code:
      | "VARIANT_NOT_FOUND"
      | "SKU_COMPLIANCE_BLOCKED"
      | "INSUFFICIENT_STOCK"
      | "INVALID_QUANTITY"
      | "INVALID_COUPON",
    message: string,
  ) {
    super(message);
    this.name = "CartDomainError";
  }
}

export async function setCartItemQuantity(
  owner: CartOwner,
  variantId: string,
  quantity: number,
  mode: "increment" | "set" = "increment",
  dbOverride?: Database,
): Promise<HydratedCartView> {
  if (!Number.isInteger(quantity) || (mode === "increment" && quantity <= 0) || quantity < 0) {
    throw new CartDomainError("INVALID_QUANTITY", "Quantity must be a whole number.");
  }

  const db = dbOverride ?? (await getDb());
  const cart = await findOrCreateCart(owner, db);

  if (mode === "set" && quantity === 0) {
    await db
      .delete(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
      );
    return getHydratedCart(owner, undefined, db);
  }

  const { availableStock, product } = await verifyVariantPurchasable(
    variantId,
    db,
  );

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)),
    );

  const targetQty =
    mode === "increment" ? (existing?.quantity ?? 0) + quantity : quantity;
  const cappedQty = Math.min(MAX_QTY_PER_LINE, targetQty);

  if (availableStock <= 0 || cappedQty > availableStock) {
    throw new CartDomainError(
      "INSUFFICIENT_STOCK",
      `Only ${availableStock} unit(s) of ${product.name} currently available.`,
    );
  }

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: cappedQty, updatedAt: new Date() })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      id: `ci_${randomBytes(12).toString("hex")}`,
      cartId: cart.id,
      variantId,
      quantity: cappedQty,
    });
  }

  return getHydratedCart(owner, undefined, db);
}

export async function applyCouponToCart(
  owner: CartOwner,
  code: string | null,
  dbOverride?: Database,
): Promise<HydratedCartView> {
  const db = dbOverride ?? (await getDb());
  const cart = await findOrCreateCart(owner, db);

  if (!code || !code.trim()) {
    await db
      .update(carts)
      .set({ appliedCouponCode: null, updatedAt: new Date() })
      .where(eq(carts.id, cart.id));
    return getHydratedCart(owner, undefined, db);
  }

  const currentView = await getHydratedCart(owner, undefined, db);
  const evaluation = await validateCouponInDb(
    code,
    currentView.pricing.subtotalPaise,
    db,
  );

  if (!evaluation.valid) {
    throw new CartDomainError("INVALID_COUPON", evaluation.message);
  }

  await db
    .update(carts)
    .set({ appliedCouponCode: evaluation.code, updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  return getHydratedCart(owner, undefined, db);
}

export async function getHydratedCart(
  owner: CartOwner,
  destinationStateCode?: string,
  dbOverride?: DbExecutor,
): Promise<HydratedCartView> {
  const db = dbOverride ?? (await getDb());
  const config = await loadShippingConfig(destinationStateCode, db);

  let cartRow: typeof carts.$inferSelect | undefined;
  if (owner.userId) {
    [cartRow] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, owner.userId));
  } else if (owner.guestTokenHash) {
    [cartRow] = await db
      .select()
      .from(carts)
      .where(eq(carts.guestTokenHash, owner.guestTokenHash));
  }

  if (!cartRow) {
    return {
      cartId: null,
      items: [],
      totalItemCount: 0,
      appliedCouponCode: null,
      couponDescription: null,
      couponMessage: null,
      pricing: computeOrderPricing([], 0, config),
    };
  }

  const rawRows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartRow.id));

  const appEnv = getEffectiveAppEnv();
  const lines: HydratedCartLine[] = [];

  for (const r of rawRows) {
    const verdict = evaluateFssaiPublishingGate(
      {
        slug: r.product.slug,
        name: r.product.name,
        jurisdiction: r.product.jurisdiction,
        fssaiCategory: r.product.fssaiCategory,
        ingredientEligibilityState: r.product.ingredientEligibilityState,
        complianceReviewState: r.product.complianceReviewState,
        publishStatus: r.product.publishStatus,
        fboLicenseNumber: r.product.fboLicenseNumber,
        fboLicenseVerified: r.product.fboLicenseVerified,
        manufacturerName: r.product.manufacturerName,
        warningsJson: r.product.warningsJson,
        shortSummary: r.product.shortSummary,
        editorialDescription: r.product.editorialDescription,
        labelSummary: r.product.labelSummary,
        isDemoSeed: r.product.isDemoSeed,
        activeVariants: [
          {
            sku: r.variant.sku,
            batchNumber: r.variant.batchNumber,
            expiryDate: r.variant.expiryDate,
          },
        ],
      },
      { appEnv: appEnv === "production" ? "production" : "demo" },
    );

    const availableStock = Math.max(
      0,
      r.variant.stockOnHand - r.variant.stockReserved,
    );

    if (!r.variant.isActive || !verdict.canAppearInPublicStore || availableStock <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, r.item.id));
      continue;
    }

    const safeQty = Math.min(r.item.quantity, availableStock, MAX_QTY_PER_LINE);
    if (safeQty !== r.item.quantity) {
      await db
        .update(cartItems)
        .set({ quantity: safeQty })
        .where(eq(cartItems.id, r.item.id));
    }

    lines.push({
      itemId: r.item.id,
      variantId: r.variant.id,
      productId: r.product.id,
      productSlug: r.product.slug,
      productName: r.product.name,
      sku: r.variant.sku,
      variantTitle: r.variant.title,
      imagePath: r.product.imagePath,
      unitPricePaise: r.variant.pricePaise,
      gstRateBps: r.variant.gstRateBps,
      quantity: safeQty,
      lineTotalPaise: r.variant.pricePaise * safeQty,
      availableStock,
      batchNumber: r.variant.batchNumber,
      expiryDate: r.variant.expiryDate,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalPaise, 0);
  let rawDiscountPaise = 0;
  let appliedCouponCode: string | null = null;
  let couponDescription: string | null = null;
  let couponMessage: string | null = null;

  if (cartRow.appliedCouponCode && lines.length > 0) {
    const evalResult = await validateCouponInDb(
      cartRow.appliedCouponCode,
      subtotal,
      db,
    );
    if (evalResult.valid) {
      rawDiscountPaise = evalResult.discountPaise;
      appliedCouponCode = evalResult.code;
      couponDescription = evalResult.description;
    } else {
      couponMessage = evalResult.message;
    }
  }

  const pricing = computeOrderPricing(
    lines.map((l) => ({
      variantId: l.variantId,
      unitPricePaise: l.unitPricePaise,
      quantity: l.quantity,
      gstRateBps: l.gstRateBps,
    })),
    rawDiscountPaise,
    config,
  );

  return {
    cartId: cartRow.id,
    items: lines,
    totalItemCount: lines.reduce((s, l) => s + l.quantity, 0),
    appliedCouponCode,
    couponDescription,
    couponMessage,
    pricing,
  };
}

/**
 * Safely merges a guest cart into an authenticated user's cart on login/signup,
 * capping merged quantities against live stock andMAX_QTY_PER_LINE inside a transaction.
 */
export async function mergeGuestCartIntoUserCart(
  guestTokenHash: string | null | undefined,
  userId: string,
  dbOverride?: Database,
): Promise<void> {
  if (!guestTokenHash) return;
  const db = dbOverride ?? (await getDb());

  await db.transaction(async (tx) => {
    const [guestCart] = await tx
      .select()
      .from(carts)
      .where(eq(carts.guestTokenHash, guestTokenHash));

    if (!guestCart) return;

    const guestRows = await tx
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    if (guestRows.length === 0) {
      await tx.delete(carts).where(eq(carts.id, guestCart.id));
      return;
    }

    const userCart = await findOrCreateCart({ userId }, tx);
    const userRows = await tx
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart.id));

    const userItemByVariant = new Map(userRows.map((r) => [r.variantId, r]));

    for (const gItem of guestRows) {
      try {
        const { availableStock } = await verifyVariantPurchasable(
          gItem.variantId,
          tx,
        );
        if (availableStock <= 0) continue;

        const existing = userItemByVariant.get(gItem.variantId);
        const mergedQty = Math.min(
          MAX_QTY_PER_LINE,
          availableStock,
          (existing?.quantity ?? 0) + gItem.quantity,
        );

        if (existing) {
          await tx
            .update(cartItems)
            .set({ quantity: mergedQty, updatedAt: new Date() })
            .where(eq(cartItems.id, existing.id));
        } else {
          await tx.insert(cartItems).values({
            id: `ci_${randomBytes(12).toString("hex")}`,
            cartId: userCart.id,
            variantId: gItem.variantId,
            quantity: mergedQty,
          });
        }
      } catch {
        // Skip items that became compliance-held or inactive since guest added them.
      }
    }

    if (!userCart.appliedCouponCode && guestCart.appliedCouponCode) {
      await tx
        .update(carts)
        .set({ appliedCouponCode: guestCart.appliedCouponCode })
        .where(eq(carts.id, userCart.id));
    }

    await tx.delete(carts).where(eq(carts.id, guestCart.id));
  });
}
