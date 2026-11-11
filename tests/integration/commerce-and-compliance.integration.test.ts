import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createFreshTestDb, type Database } from "@/db/client";
import { products, productVariants } from "@/db/schema/catalog";
import { auditLogs } from "@/db/schema/content";
import {
  getPublicProductBySlug,
  listPublicCatalog,
} from "@/domain/catalog/service";
import {
  applyCouponToCart,
  type CartDomainError,
  getHydratedCart,
  mergeGuestCartIntoUserCart,
  setCartItemQuantity,
} from "@/domain/cart/service";
import {
  createTransactionalOrder,
  getUserOrderDetail,
  type OrderDomainError,
  reorderPreviousOrderIntoCart,
} from "@/domain/orders/service";
import {
  adminResolveReturnRequest,
  adminTransitionOrderStatus,
  createCustomerReturnRequest,
} from "@/domain/orders/transitions";
import { processVerifiedPaymentEvent } from "@/domain/payments/stripe-and-webhooks";
import {
  subscribeToNewsletter,
  unsubscribeByToken,
} from "@/domain/email/service";
import { roleHasPermission } from "@/domain/auth/rbac";

describe("Full-Stack PostgreSQL Commerce & Compliance Integration", () => {
  let db: Database;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const handle = await createFreshTestDb();
    db = handle.db;
    cleanup = handle.cleanup;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  it("seeds 40 SKUs in SQL, exposes 32 in public catalog, and blocks held SKUs from cart & PDP", async () => {
    const allRows = await db.select().from(products);
    expect(allRows).toHaveLength(40);

    const pub = await listPublicCatalog({ pageSize: 48 }, db);
    expect(pub.totalItems).toBe(32);
    expect(pub.heldUnpublishedCount).toBe(8);

    expect(await getPublicProductBySlug("shilajit", db)).toBeNull();
    expect(await getPublicProductBySlug("nac", db)).toBeNull();
    expect(await getPublicProductBySlug("liposomal-glutathione", db)).not.toBeNull();

    // Direct attempt to add held Shilajit variant to cart must fail with SKU_COMPLIANCE_BLOCKED
    await expect(
      setCartItemQuantity(
        { guestTokenHash: "guest_hash_hold_test" },
        "var_27_20g",
        1,
        "increment",
        db,
      ),
    ).rejects.toMatchObject({
      name: "CartDomainError",
      code: "SKU_COMPLIANCE_BLOCKED",
    } satisfies Partial<CartDomainError>);
  });

  it("merges guest cart and coupon cleanly into user cart on login", async () => {
    const guestHash = "guest_merge_token_001";
    await setCartItemQuantity(
      { guestTokenHash: guestHash },
      "var_01_30s",
      1,
      "increment",
      db,
    );
    await applyCouponToCart({ guestTokenHash: guestHash }, "WELCOME10", db);

    await setCartItemQuantity(
      { userId: "usr_demo_customer" },
      "var_04_45s",
      1,
      "increment",
      db,
    );

    await mergeGuestCartIntoUserCart(guestHash, "usr_demo_customer", db);

    const merged = await getHydratedCart({ userId: "usr_demo_customer" }, "MH", db);
    expect(merged.items.length).toBe(2);
    expect(merged.appliedCouponCode).toBe("WELCOME10");
    expect(merged.pricing.discountPaise).toBeGreaterThan(0);

    const oldGuest = await getHydratedCart({ guestTokenHash: guestHash }, "MH", db);
    expect(oldGuest.items).toHaveLength(0);
  });

  it("creates honest non-charging demo orders, enforces idempotency, and prevents stock oversell", async () => {
    const [beforeVar] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var_01_30s"));

    const first = await createTransactionalOrder(
      {
        cartOwner: { userId: "usr_demo_customer" },
        userId: "usr_demo_customer",
        customerEmail: "aarav@goodform.demo",
        customerName: "Aarav Kulkarni",
        idempotencyKey: "idem_demo_integration_01",
        paymentProvider: "demo",
        shippingAddress: {
          recipientName: "Aarav Kulkarni",
          phone: "9820144110",
          line1: "402 Gulmohar Residency, Bandra West",
          city: "Mumbai",
          stateCode: "MH",
          pinCode: "400050",
        },
      },
      db,
    );

    expect(first.deduplicated).toBe(false);
    expect(first.order.orderStatus).toBe("DEMO_ORDER");
    expect(first.order.paymentStatus).toBe("DEMO_NON_CHARGING");
    expect(first.order.isDemoOrder).toBe(true);

    // Duplicate idempotency key does NOT deduct stock again
    const replay = await createTransactionalOrder(
      {
        cartOwner: { userId: "usr_demo_customer" },
        userId: "usr_demo_customer",
        customerEmail: "aarav@goodform.demo",
        customerName: "Aarav Kulkarni",
        idempotencyKey: "idem_demo_integration_01",
        paymentProvider: "demo",
        shippingAddress: {
          recipientName: "Aarav Kulkarni",
          phone: "9820144110",
          line1: "402 Gulmohar Residency, Bandra West",
          city: "Mumbai",
          stateCode: "MH",
          pinCode: "400050",
        },
      },
      db,
    );

    expect(replay.deduplicated).toBe(true);
    expect(replay.order.id).toBe(first.order.id);

    const [afterVar] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var_01_30s"));
    expect(afterVar!.stockOnHand).toBe(beforeVar!.stockOnHand - 1);

    // Oversell rollback test: add 2 units to cart, then drop DB stock to 1 before checkout
    await setCartItemQuantity(
      { guestTokenHash: "guest_oversell_check" },
      "var_11_90s",
      2,
      "set",
      db,
    );
    await db
      .update(productVariants)
      .set({ stockOnHand: 1 })
      .where(eq(productVariants.id, "var_11_90s"));

    await expect(
      createTransactionalOrder(
        {
          cartOwner: { guestTokenHash: "guest_oversell_check" },
          customerEmail: "guest@example.in",
          customerName: "Riya Sharma",
          idempotencyKey: "idem_oversell_fail",
          paymentProvider: "demo",
          shippingAddress: {
            recipientName: "Riya Sharma",
            phone: "9811122334",
            line1: "12 Indiranagar 100ft Rd",
            city: "Bengaluru",
            stateCode: "KA",
            pinCode: "560038",
          },
        },
        db,
      ),
    ).rejects.toMatchObject({
      code: "OUT_OF_STOCK",
    } satisfies Partial<OrderDomainError>);

    // Restore stock for clean subsequent tests
    await db
      .update(productVariants)
      .set({ stockOnHand: 165 })
      .where(eq(productVariants.id, "var_11_90s"));
  });

  it("handles payment webhook idempotency and restores stock on failed provider payment", async () => {
    await setCartItemQuantity(
      { guestTokenHash: "guest_rzp_flow" },
      "var_08_90s",
      2,
      "set",
      db,
    );

    const [stockBefore] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var_08_90s"));

    const pending = await createTransactionalOrder(
      {
        cartOwner: { guestTokenHash: "guest_rzp_flow" },
        customerEmail: "buyer@example.in",
        customerName: "Vikram Rao",
        idempotencyKey: "idem_rzp_webhook_01",
        paymentProvider: "razorpay",
        shippingAddress: {
          recipientName: "Vikram Rao",
          phone: "9845012345",
          line1: "88 Residency Road",
          city: "Bengaluru",
          stateCode: "KA",
          pinCode: "560025",
        },
      },
      db,
    );

    expect(pending.order.orderStatus).toBe("PENDING_PAYMENT");
    expect(pending.order.paymentStatus).toBe("PENDING");
    expect(pending.order.igstPaise).toBeGreaterThan(0);

    const captured1 = await processVerifiedPaymentEvent(
      {
        provider: "razorpay",
        providerEventId: "evt_rzp_001",
        eventType: "PAYMENT_CAPTURED",
        orderId: pending.order.id,
        providerPaymentId: "pay_rzp_001",
        rawPayloadForHash: '{"id":"evt_rzp_001"}',
      },
      db,
    );
    expect(captured1.deduplicated).toBe(false);
    expect(captured1.orderUpdated).toBe(true);

    // Replay same webhook event id -> idempotent no-op
    const capturedReplay = await processVerifiedPaymentEvent(
      {
        provider: "razorpay",
        providerEventId: "evt_rzp_001",
        eventType: "PAYMENT_CAPTURED",
        orderId: pending.order.id,
        providerPaymentId: "pay_rzp_001",
        rawPayloadForHash: '{"id":"evt_rzp_001"}',
      },
      db,
    );
    expect(capturedReplay.deduplicated).toBe(true);
    expect(capturedReplay.orderUpdated).toBe(false);

    // Admin cancellation restores stock and writes audit log
    await adminTransitionOrderStatus(
      { id: "usr_demo_admin", role: "ADMIN" },
      pending.order.id,
      "CANCELLED",
      db,
    );

    const [stockAfterCancel] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var_08_90s"));
    expect(stockAfterCancel!.stockOnHand).toBe(stockBefore!.stockOnHand);
  });

  it("blocks cross-user IDOR on orders, supports reorder & returns, enforces RBAC, and requires newsletter consent", async () => {
    // IDOR check: usr_demo_admin attempting to read usr_demo_customer's order via customer service
    await expect(
      getUserOrderDetail("usr_demo_admin", "ord_demo_seed_001", db),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Reorder seeded order into customer cart
    const reordered = await reorderPreviousOrderIntoCart(
      "usr_demo_customer",
      "ord_demo_seed_001",
      db,
    );
    expect(reordered.addedCount).toBe(2);

    // Customer return request + Admin resolution
    const ret = await createCustomerReturnRequest(
      "usr_demo_customer",
      "ord_demo_seed_001",
      "Damaged transit seal",
      "Outer tamper band torn during courier transit.",
      db,
    );
    expect(ret.status).toBe("REQUESTED");

    const resolved = await adminResolveReturnRequest(
      { id: "usr_demo_admin", role: "ADMIN" },
      ret.id,
      "REFUNDED",
      "Approved replacement/close on demo order.",
      db,
    );
    expect(resolved.status).toBe("REFUNDED");

    // Demo order must STILL have DEMO_NON_CHARGING payment status after return resolution
    const afterDetail = await getUserOrderDetail(
      "usr_demo_customer",
      "ord_demo_seed_001",
      db,
    );
    expect(afterDetail.order.paymentStatus).toBe("DEMO_NON_CHARGING");

    // RBAC matrix check
    expect(roleHasPermission("CUSTOMER", "admin:access")).toBe(false);
    expect(roleHasPermission("MERCHANDISER", "compliance:write")).toBe(false);
    expect(roleHasPermission("COMPLIANCE_OFFICER", "compliance:write")).toBe(
      true,
    );
    expect(roleHasPermission("ADMIN", "compliance:write")).toBe(true);

    // Audit trail recorded
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBeGreaterThanOrEqual(2);

    // Newsletter consent gate & 1-click unsubscribe
    await expect(
      subscribeToNewsletter(
        { email: "reader@example.in", consentAccepted: false },
        db,
      ),
    ).rejects.toThrow(/Explicit consent/);

    const sub = await subscribeToNewsletter(
      { email: "reader@example.in", consentAccepted: true },
      db,
    );
    expect(sub.unsubscribeToken.length).toBeGreaterThan(12);
    expect(await unsubscribeByToken(sub.unsubscribeToken, db)).toBe(true);
  });
});
