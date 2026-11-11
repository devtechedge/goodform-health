import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { getDb, type Database } from "@/db/client";
import { productVariants } from "@/db/schema/catalog";
import {
  orderItems,
  orders,
  paymentWebhookEvents,
  type PaymentProvider,
} from "@/db/schema/commerce";
import { sha256Hex } from "@/domain/auth/session";
import { getEnv, getSiteUrl, isStripeConfigured } from "@/env";

export async function createStripeCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  totalPaise: number;
}): Promise<{ providerOrderId: string; checkoutUrl: string }> {
  const env = getEnv();
  if (!isStripeConfigured() || !env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe credentials are not configured.");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: params.totalPaise,
          product_data: {
            name: `GOODFORM Order ${params.orderNumber}`,
          },
        },
      },
    ],
    metadata: {
      goodform_order_id: params.orderId,
      goodform_order_number: params.orderNumber,
    },
    success_url: `${siteUrl}/account/orders/${params.orderId}?payment=submitted`,
    cancel_url: `${siteUrl}/checkout?cancelled=${params.orderNumber}`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a hosted checkout URL.");
  }

  return {
    providerOrderId: session.id,
    checkoutUrl: session.url,
  };
}

export function verifyAndParseStripeWebhook(params: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  webhookSecretOverride?: string;
}): Stripe.Event {
  const env = getEnv();
  const secret = params.webhookSecretOverride ?? env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !params.signatureHeader) {
    throw new Error("Missing Stripe webhook secret or signature header.");
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");
  return stripe.webhooks.constructEvent(
    params.rawBody,
    params.signatureHeader,
    secret,
  );
}

export interface VerifiedPaymentEventInput {
  provider: Extract<PaymentProvider, "razorpay" | "stripe">;
  providerEventId: string;
  eventType: "PAYMENT_CAPTURED" | "PAYMENT_FAILED" | "PAYMENT_REFUNDED";
  orderId?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  rawPayloadForHash: string;
}

export async function processVerifiedPaymentEvent(
  event: VerifiedPaymentEventInput,
  dbOverride?: Database,
): Promise<{
  deduplicated: boolean;
  orderUpdated: boolean;
  orderId: string | null;
}> {
  const db = dbOverride ?? (await getDb());

  // Fast pre-check for duplicate webhook delivery
  const [alreadyProcessed] = await db
    .select()
    .from(paymentWebhookEvents)
    .where(
      and(
        eq(paymentWebhookEvents.provider, event.provider),
        eq(paymentWebhookEvents.providerEventId, event.providerEventId),
      ),
    );

  if (alreadyProcessed) {
    return {
      deduplicated: true,
      orderUpdated: false,
      orderId: alreadyProcessed.orderId,
    };
  }

  return db.transaction(async (tx) => {
    const [insideExisting] = await tx
      .select()
      .from(paymentWebhookEvents)
      .where(
        and(
          eq(paymentWebhookEvents.provider, event.provider),
          eq(paymentWebhookEvents.providerEventId, event.providerEventId),
        ),
      );

    if (insideExisting) {
      return {
        deduplicated: true,
        orderUpdated: false,
        orderId: insideExisting.orderId,
      };
    }

    let targetOrder: typeof orders.$inferSelect | undefined;
    if (event.orderId) {
      [targetOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, event.orderId));
    } else if (event.providerOrderId) {
      [targetOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.providerOrderId, event.providerOrderId));
    }

    await tx.insert(paymentWebhookEvents).values({
      id: `wh_${randomBytes(12).toString("hex")}`,
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventType: event.eventType,
      orderId: targetOrder?.id ?? event.orderId ?? null,
      payloadSha256: sha256Hex(event.rawPayloadForHash),
    });

    if (!targetOrder || targetOrder.isDemoOrder) {
      return {
        deduplicated: false,
        orderUpdated: false,
        orderId: targetOrder?.id ?? null,
      };
    }

    if (event.eventType === "PAYMENT_CAPTURED") {
      await tx
        .update(orders)
        .set({
          paymentStatus: "CAPTURED",
          orderStatus:
            targetOrder.orderStatus === "PENDING_PAYMENT"
              ? "CONFIRMED"
              : targetOrder.orderStatus,
          providerPaymentId:
            event.providerPaymentId ?? targetOrder.providerPaymentId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, targetOrder.id));
    } else if (
      event.eventType === "PAYMENT_FAILED" &&
      targetOrder.orderStatus === "PENDING_PAYMENT"
    ) {
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, targetOrder.id));

      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({
              stockOnHand: sql`${productVariants.stockOnHand} + ${item.quantity}`,
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      await tx
        .update(orders)
        .set({
          paymentStatus: "FAILED",
          orderStatus: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, targetOrder.id));
    } else if (event.eventType === "PAYMENT_REFUNDED") {
      await tx
        .update(orders)
        .set({
          paymentStatus: "REFUNDED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, targetOrder.id));
    }

    return {
      deduplicated: false,
      orderUpdated: true,
      orderId: targetOrder.id,
    };
  });
}
