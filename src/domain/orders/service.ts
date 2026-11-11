import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { products, productVariants } from "@/db/schema/catalog";
import {
  cartItems,
  carts,
  coupons,
  orderItems,
  orders,
  type PaymentProvider,
  type ShippingAddressSnapshot,
} from "@/db/schema/commerce";
import { storeSettings } from "@/db/schema/content";
import { setCartItemQuantity, type CartOwner } from "@/domain/cart/service";
import { evaluateFssaiPublishingGate } from "@/domain/compliance/fssai-gate";
import { evaluateCouponRecord } from "@/domain/pricing/coupons";
import { computeOrderPricing } from "@/domain/pricing/totals";
import { getEffectiveAppEnv } from "@/env";
import {
  getStateByCode,
  isValidIndianMobile,
  isValidIndianPin,
} from "@/lib/india";

export class OrderDomainError extends Error {
  constructor(
    public readonly code:
      | "EMPTY_CART"
      | "INVALID_ADDRESS"
      | "SKU_COMPLIANCE_BLOCKED"
      | "OUT_OF_STOCK"
      | "COUPON_INVALID"
      | "NOT_FOUND"
      | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "OrderDomainError";
  }
}

export interface CreateOrderInput {
  cartOwner: CartOwner;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  idempotencyKey: string;
  paymentProvider: PaymentProvider;
  shippingAddress: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    stateCode: string;
    pinCode: string;
  };
  notes?: string;
}

export async function createTransactionalOrder(
  input: CreateOrderInput,
  dbOverride?: Database,
): Promise<{
  order: typeof orders.$inferSelect;
  items: Array<typeof orderItems.$inferSelect>;
  deduplicated: boolean;
}> {
  if (!isValidIndianPin(input.shippingAddress.pinCode)) {
    throw new OrderDomainError(
      "INVALID_ADDRESS",
      "Enter a valid 6-digit Indian PIN code (e.g. 400050).",
    );
  }

  const stateInfo = getStateByCode(input.shippingAddress.stateCode);
  if (!stateInfo) {
    throw new OrderDomainError(
      "INVALID_ADDRESS",
      "Select a valid Indian State or Union Territory.",
    );
  }

  if (!isValidIndianMobile(input.shippingAddress.phone)) {
    throw new OrderDomainError(
      "INVALID_ADDRESS",
      "Enter a valid 10-digit Indian mobile number.",
    );
  }

  const db = dbOverride ?? (await getDb());

  // Fast idempotency check prior to transaction
  const [existingByIdem] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, input.idempotencyKey));

  if (existingByIdem) {
    const existingItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, existingByIdem.id));
    return {
      order: existingByIdem,
      items: existingItems,
      deduplicated: true,
    };
  }

  const appEnv = getEffectiveAppEnv();

  return db.transaction(async (tx) => {
    const [idemInside] = await tx
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey));

    if (idemInside) {
      const existingItems = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, idemInside.id));
      return {
        order: idemInside,
        items: existingItems,
        deduplicated: true,
      };
    }

    let cartRow: typeof carts.$inferSelect | undefined;
    if (input.cartOwner.userId) {
      [cartRow] = await tx
        .select()
        .from(carts)
        .where(eq(carts.userId, input.cartOwner.userId));
    } else if (input.cartOwner.guestTokenHash) {
      [cartRow] = await tx
        .select()
        .from(carts)
        .where(eq(carts.guestTokenHash, input.cartOwner.guestTokenHash));
    }

    if (!cartRow) {
      throw new OrderDomainError("EMPTY_CART", "Your cart is empty.");
    }

    const rawCartLines = await tx
      .select({
        cartItem: cartItems,
        variant: productVariants,
        product: products,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cartRow.id));

    if (rawCartLines.length === 0) {
      throw new OrderDomainError("EMPTY_CART", "Your cart has no items.");
    }

    // 1. Validate FSSAI gate & atomically decrement stock on each variant
    const lockedLines: Array<{
      product: typeof products.$inferSelect;
      variant: typeof productVariants.$inferSelect;
      quantity: number;
    }> = [];

    for (const row of rawCartLines) {
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
        throw new OrderDomainError(
          "SKU_COMPLIANCE_BLOCKED",
          `${row.product.name} cannot be ordered due to an active India FSSAI compliance hold.`,
        );
      }

      const qty = row.cartItem.quantity;
      const updatedVariants = await tx
        .update(productVariants)
        .set({
          stockOnHand: sql`${productVariants.stockOnHand} - ${qty}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productVariants.id, row.variant.id),
            eq(productVariants.isActive, true),
            sql`(${productVariants.stockOnHand} - ${productVariants.stockReserved}) >= ${qty}`,
          ),
        )
        .returning();

      if (updatedVariants.length === 0) {
        throw new OrderDomainError(
          "OUT_OF_STOCK",
          `Insufficient stock for ${row.product.name} (${row.variant.title}).`,
        );
      }

      lockedLines.push({
        product: row.product,
        variant: updatedVariants[0]!,
        quantity: qty,
      });
    }

    // 2. Recompute subtotal, coupon, shipping, and India GST from authoritative DB prices
    const subtotalPaise = lockedLines.reduce(
      (sum, l) => sum + l.variant.pricePaise * l.quantity,
      0,
    );

    let rawDiscountPaise = 0;
    let appliedCouponCode: string | null = null;

    if (cartRow.appliedCouponCode) {
      const [cpn] = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, cartRow.appliedCouponCode));

      const evalCpn = evaluateCouponRecord(cpn, subtotalPaise);
      if (!evalCpn.valid) {
        throw new OrderDomainError("COUPON_INVALID", evalCpn.message);
      }

      const updatedCoupon = await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(
          and(
            eq(coupons.id, cpn!.id),
            eq(coupons.isActive, true),
            sql`(${coupons.usageLimit} IS NULL OR ${coupons.usedCount} < ${coupons.usageLimit})`,
          ),
        )
        .returning();

      if (updatedCoupon.length === 0) {
        throw new OrderDomainError(
          "COUPON_INVALID",
          "Coupon redemption limit has been reached.",
        );
      }

      rawDiscountPaise = evalCpn.discountPaise;
      appliedCouponCode = evalCpn.code;
    }

    const [settings] = await tx
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, "default"));

    const pricing = computeOrderPricing(
      lockedLines.map((l) => ({
        variantId: l.variant.id,
        unitPricePaise: l.variant.pricePaise,
        quantity: l.quantity,
        gstRateBps: l.variant.gstRateBps,
      })),
      rawDiscountPaise,
      {
        freeShippingThresholdPaise: settings?.freeShippingThresholdPaise ?? 99900,
        standardShippingPaise: settings?.standardShippingPaise ?? 7900,
        dispatchStateCode: settings?.dispatchStateCode ?? "MH",
        destinationStateCode: stateInfo.code,
      },
    );

    const isDemo = input.paymentProvider === "demo";
    const orderId = `ord_${randomBytes(12).toString("hex")}`;
    const orderNumber = `GF-2026-${randomBytes(3).toString("hex").toUpperCase()}`;

    const addressSnapshot: ShippingAddressSnapshot = {
      recipientName: input.shippingAddress.recipientName.trim(),
      phone: input.shippingAddress.phone.trim(),
      line1: input.shippingAddress.line1.trim(),
      line2: input.shippingAddress.line2?.trim() || undefined,
      landmark: input.shippingAddress.landmark?.trim() || undefined,
      city: input.shippingAddress.city.trim(),
      stateCode: stateInfo.code,
      stateName: stateInfo.name,
      pinCode: input.shippingAddress.pinCode.trim(),
    };

    const [createdOrder] = await tx
      .insert(orders)
      .values({
        id: orderId,
        orderNumber,
        userId: input.userId ?? null,
        customerEmail: input.customerEmail.trim().toLowerCase(),
        customerName: input.customerName.trim(),
        idempotencyKey: input.idempotencyKey,
        orderStatus: isDemo ? "DEMO_ORDER" : "PENDING_PAYMENT",
        paymentProvider: input.paymentProvider,
        paymentStatus: isDemo ? "DEMO_NON_CHARGING" : "PENDING",
        couponCode: appliedCouponCode,
        subtotalPaise: pricing.subtotalPaise,
        discountPaise: pricing.discountPaise,
        shippingPaise: pricing.shippingPaise,
        taxablePaise: pricing.taxablePaise,
        cgstPaise: pricing.cgstPaise,
        sgstPaise: pricing.sgstPaise,
        igstPaise: pricing.igstPaise,
        totalPaise: pricing.totalPaise,
        shippingAddressJson: addressSnapshot,
        isDemoOrder: isDemo,
        notes: input.notes?.trim() || null,
      })
      .returning();

    const itemValues = lockedLines.map((l) => ({
      id: `oi_${randomBytes(12).toString("hex")}`,
      orderId,
      productId: l.product.id,
      variantId: l.variant.id,
      sku: l.variant.sku,
      productSlug: l.product.slug,
      productName: l.product.name,
      variantTitle: l.variant.title,
      batchNumber: l.variant.batchNumber,
      expiryDate: l.variant.expiryDate,
      ingredientSnapshot: l.product.ingredientsJson
        .map((ing) => `${ing.name}: ${ing.amountDisplay}`)
        .join("; "),
      quantity: l.quantity,
      unitPricePaise: l.variant.pricePaise,
      gstRateBps: l.variant.gstRateBps,
      lineTotalPaise: l.variant.pricePaise * l.quantity,
    }));

    const insertedItems = await tx
      .insert(orderItems)
      .values(itemValues)
      .returning();

    // Clear cart items and coupon
    await tx.delete(cartItems).where(eq(cartItems.cartId, cartRow.id));
    await tx
      .update(carts)
      .set({ appliedCouponCode: null, updatedAt: new Date() })
      .where(eq(carts.id, cartRow.id));

    return {
      order: createdOrder!,
      items: insertedItems,
      deduplicated: false,
    };
  });
}

export async function listUserOrders(userId: string, dbOverride?: Database) {
  const db = dbOverride ?? (await getDb());
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) return [];

  const allItems = await db.select().from(orderItems);
  const byOrder = new Map<string, Array<typeof orderItems.$inferSelect>>();
  for (const item of allItems) {
    const arr = byOrder.get(item.orderId) ?? [];
    arr.push(item);
    byOrder.set(item.orderId, arr);
  }

  return userOrders.map((o) => ({
    ...o,
    items: byOrder.get(o.id) ?? [],
  }));
}

export async function getUserOrderDetail(
  userId: string,
  orderId: string,
  dbOverride?: Database,
) {
  const db = dbOverride ?? (await getDb());
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    throw new OrderDomainError("NOT_FOUND", "Order not found.");
  }
  if (order.userId !== userId) {
    throw new OrderDomainError("FORBIDDEN", "You do not have access to this order.");
  }
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { order, items };
}

export async function reorderPreviousOrderIntoCart(
  userId: string,
  orderId: string,
  dbOverride?: Database,
): Promise<{ addedCount: number; skippedItems: string[] }> {
  const db = dbOverride ?? (await getDb());
  const { items } = await getUserOrderDetail(userId, orderId, db);

  let addedCount = 0;
  const skippedItems: string[] = [];

  for (const item of items) {
    if (!item.variantId) {
      skippedItems.push(`${item.productName} (discontinued pack)`);
      continue;
    }
    try {
      await setCartItemQuantity(
        { userId },
        item.variantId,
        item.quantity,
        "increment",
        db,
      );
      addedCount += 1;
    } catch (err) {
      skippedItems.push(
        `${item.productName}: ${err instanceof Error ? err.message : "unavailable"}`,
      );
    }
  }

  return { addedCount, skippedItems };
}
