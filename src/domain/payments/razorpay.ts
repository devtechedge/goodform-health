import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { getEnv, isRazorpayConfigured } from "@/env";

export interface RazorpayOrderCreateResult {
  providerOrderId: string;
  amountPaise: number;
  currency: "INR";
  keyId: string;
}

export async function createRazorpayOrder(params: {
  orderId: string;
  orderNumber: string;
  amountPaise: number;
}): Promise<RazorpayOrderCreateResult> {
  const env = getEnv();
  if (!isRazorpayConfigured() || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured.");
  }

  const instance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  const rzpOrder = await instance.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.orderNumber,
    notes: {
      goodform_order_id: params.orderId,
      goodform_order_number: params.orderNumber,
    },
  });

  return {
    providerOrderId: rzpOrder.id,
    amountPaise: Number(rzpOrder.amount),
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
  };
}

export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secretOverride?: string;
}): boolean {
  const secret = params.secretOverride ?? getEnv().RAZORPAY_KEY_SECRET;
  if (!secret || !params.razorpaySignature) return false;

  const expectedHex = createHmac("sha256", secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(params.razorpaySignature.trim(), "utf8");
  const b = Buffer.from(expectedHex, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  webhookSecretOverride?: string;
}): boolean {
  const secret =
    params.webhookSecretOverride ?? getEnv().RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !params.signatureHeader) return false;

  const expectedHex = createHmac("sha256", secret)
    .update(params.rawBody)
    .digest("hex");

  const a = Buffer.from(params.signatureHeader.trim(), "utf8");
  const b = Buffer.from(expectedHex, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
