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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { products, productVariants } from "./catalog";
import { users } from "./users";

export type OrderStatus =
  | "DEMO_ORDER"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

export type PaymentProvider = "razorpay" | "stripe" | "demo";

export type PaymentStatus =
  | "PENDING"
  | "DEMO_NON_CHARGING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "REFUNDED";

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  stateCode: string;
  stateName: string;
  pinCode: string;
}

export const carts = pgTable(
  "carts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    guestTokenHash: text("guest_token_hash").unique(),
    appliedCouponCode: text("applied_coupon_code"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_carts_guest_token").on(t.guestTokenHash)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uidx_cart_items_cart_variant").on(t.cartId, t.variantId),
    check("chk_cart_items_qty_pos", sql`${t.quantity} > 0`),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uidx_wishlist_user_product").on(t.userId, t.productId),
  ],
);

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type")
    .$type<"PERCENT" | "FIXED_PAISE">()
    .notNull(),
  discountValue: integer("discount_value").notNull(),
  minSubtotalPaise: integer("min_subtotal_paise").notNull().default(0),
  maxDiscountPaise: integer("max_discount_paise"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    orderStatus: text("order_status").$type<OrderStatus>().notNull(),
    paymentProvider: text("payment_provider")
      .$type<PaymentProvider>()
      .notNull(),
    paymentStatus: text("payment_status").$type<PaymentStatus>().notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    couponCode: text("coupon_code"),
    subtotalPaise: integer("subtotal_paise").notNull(),
    discountPaise: integer("discount_paise").notNull().default(0),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    taxablePaise: integer("taxable_paise").notNull(),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
    shippingAddressJson: jsonb("shipping_address_json")
      .$type<ShippingAddressSnapshot>()
      .notNull(),
    isDemoOrder: boolean("is_demo_order").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_orders_user_id").on(t.userId),
    index("idx_orders_status").on(t.orderStatus),
    check("chk_orders_total_nonneg", sql`${t.totalPaise} >= 0`),
    check("chk_orders_subtotal_nonneg", sql`${t.subtotalPaise} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    sku: text("sku").notNull(),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    variantTitle: text("variant_title").notNull(),
    batchNumber: text("batch_number").notNull(),
    expiryDate: text("expiry_date").notNull(),
    ingredientSnapshot: text("ingredient_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
  },
  (t) => [
    index("idx_order_items_order_id").on(t.orderId),
    check("chk_order_items_qty_pos", sql`${t.quantity} > 0`),
  ],
);

export const returnRequests = pgTable(
  "return_requests",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason").notNull(),
    details: text("details").notNull(),
    status: text("status")
      .$type<ReturnStatus>()
      .notNull()
      .default("REQUESTED"),
    refundPaise: integer("refund_paise").notNull().default(0),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_returns_order_id").on(t.orderId)],
);

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").$type<PaymentProvider>().notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    orderId: text("order_id"),
    payloadSha256: text("payload_sha256").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uidx_webhook_provider_event").on(
      t.provider,
      t.providerEventId,
    ),
  ],
);
