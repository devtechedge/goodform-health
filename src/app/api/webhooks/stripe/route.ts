import { NextResponse } from "next/server";
import {
  processVerifiedPaymentEvent,
  verifyAndParseStripeWebhook,
} from "@/domain/payments/stripe-and-webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  let stripeEvent;
  try {
    stripeEvent = verifyAndParseStripeWebhook({
      rawBody,
      signatureHeader: sig,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 401 },
    );
  }

  let eventType:
    | "PAYMENT_CAPTURED"
    | "PAYMENT_FAILED"
    | "PAYMENT_REFUNDED"
    | null = null;
  let orderId: string | null = null;
  let providerOrderId: string | null = null;
  let providerPaymentId: string | null = null;

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    eventType = "PAYMENT_CAPTURED";
    orderId = session.metadata?.goodform_order_id ?? null;
    providerOrderId = session.id;
    providerPaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;
  } else if (stripeEvent.type === "checkout.session.expired") {
    const session = stripeEvent.data.object;
    eventType = "PAYMENT_FAILED";
    orderId = session.metadata?.goodform_order_id ?? null;
    providerOrderId = session.id;
  } else if (stripeEvent.type === "charge.refunded") {
    const charge = stripeEvent.data.object;
    eventType = "PAYMENT_REFUNDED";
    orderId = charge.metadata?.goodform_order_id ?? null;
    providerPaymentId = charge.id;
  }

  if (!eventType) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const result = await processVerifiedPaymentEvent({
    provider: "stripe",
    providerEventId: stripeEvent.id,
    eventType,
    orderId,
    providerOrderId,
    providerPaymentId,
    rawPayloadForHash: rawBody,
  });

  return NextResponse.json({ received: true, ...result });
}
