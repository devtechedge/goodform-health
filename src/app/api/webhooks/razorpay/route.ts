import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/domain/payments/razorpay";
import { processVerifiedPaymentEvent } from "@/domain/payments/stripe-and-webhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("x-razorpay-signature");
  const eventIdHeader = request.headers.get("x-razorpay-event-id");

  if (!verifyRazorpayWebhookSignature({ rawBody, signatureHeader: sig })) {
    return NextResponse.json(
      { error: "Invalid Razorpay webhook signature." },
      { status: 401 },
    );
  }

  let parsed: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          notes?: { goodform_order_id?: string };
        };
      };
    };
  };

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON webhook body." },
      { status: 400 },
    );
  }

  const paymentEntity = parsed.payload?.payment?.entity;
  const providerEventId =
    eventIdHeader ??
    `${parsed.event ?? "unknown"}:${paymentEntity?.id ?? "no_id"}`;

  let eventType:
    | "PAYMENT_CAPTURED"
    | "PAYMENT_FAILED"
    | "PAYMENT_REFUNDED"
    | null = null;
  if (parsed.event === "payment.captured" || parsed.event === "order.paid") {
    eventType = "PAYMENT_CAPTURED";
  } else if (parsed.event === "payment.failed") {
    eventType = "PAYMENT_FAILED";
  } else if (parsed.event?.startsWith("refund.")) {
    eventType = "PAYMENT_REFUNDED";
  }

  if (!eventType) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const result = await processVerifiedPaymentEvent({
    provider: "razorpay",
    providerEventId,
    eventType,
    orderId: paymentEntity?.notes?.goodform_order_id ?? null,
    providerOrderId: paymentEntity?.order_id ?? null,
    providerPaymentId: paymentEntity?.id ?? null,
    rawPayloadForHash: rawBody,
  });

  return NextResponse.json({ received: true, ...result });
}
