import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpayPaymentSignature } from "@/domain/payments/razorpay";
import { processVerifiedPaymentEvent } from "@/domain/payments/stripe-and-webhooks";
import { assertSameOriginOrJson403 } from "@/lib/http";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  orderId: z.string().min(4).max(80),
  razorpay_order_id: z.string().min(4).max(120),
  razorpay_payment_id: z.string().min(4).max(120),
  razorpay_signature: z.string().min(16).max(256),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Razorpay verification payload." },
      { status: 400 },
    );
  }

  const valid = verifyRazorpayPaymentSignature({
    razorpayOrderId: parsed.data.razorpay_order_id,
    razorpayPaymentId: parsed.data.razorpay_payment_id,
    razorpaySignature: parsed.data.razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json(
      { error: "Razorpay signature verification failed." },
      { status: 400 },
    );
  }

  const result = await processVerifiedPaymentEvent({
    provider: "razorpay",
    providerEventId: `callback:${parsed.data.razorpay_payment_id}`,
    eventType: "PAYMENT_CAPTURED",
    orderId: parsed.data.orderId,
    providerOrderId: parsed.data.razorpay_order_id,
    providerPaymentId: parsed.data.razorpay_payment_id,
    rawPayloadForHash: JSON.stringify(parsed.data),
  });

  return NextResponse.json({ ok: true, ...result });
}
