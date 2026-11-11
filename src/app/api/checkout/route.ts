import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema/commerce";
import { checkRateLimit } from "@/domain/auth/session";
import { sendOrderReceiptEmail } from "@/domain/email/service";
import {
  createTransactionalOrder,
  OrderDomainError,
} from "@/domain/orders/service";
import { createRazorpayOrder } from "@/domain/payments/razorpay";
import { createStripeCheckoutSession } from "@/domain/payments/stripe-and-webhooks";
import {
  getEffectiveAppEnv,
  isRazorpayConfigured,
  isStripeConfigured,
} from "@/env";
import {
  assertSameOriginOrJson403,
  extractClientKey,
  resolveRequestCartOwner,
} from "@/lib/http";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(160),
  idempotencyKey: z.string().trim().min(8).max(120),
  paymentProvider: z.enum(["razorpay", "stripe", "demo"]),
  shippingAddress: z.object({
    recipientName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(10).max(20),
    line1: z.string().trim().min(4).max(160),
    line2: z.string().trim().max(160).optional(),
    landmark: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(80),
    stateCode: z.string().trim().length(2),
    pinCode: z.string().trim().length(6),
  }),
  notes: z.string().trim().max(400).optional(),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "checkout",
    extractClientKey(request),
    20,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid checkout details." },
      { status: 400 },
    );
  }

  const { paymentProvider } = parsed.data;
  if (paymentProvider === "razorpay" && !isRazorpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Razorpay keys are not configured in this environment. Select Non-Charging Demo Checkout.",
      },
      { status: 422 },
    );
  }
  if (paymentProvider === "stripe" && !isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe keys are not configured in this environment. Select Non-Charging Demo Checkout.",
      },
      { status: 422 },
    );
  }
  if (paymentProvider === "demo" && getEffectiveAppEnv() === "production") {
    return NextResponse.json(
      { error: "Non-charging demo checkout is disabled in commercial production." },
      { status: 403 },
    );
  }

  const { user, owner } = await resolveRequestCartOwner({
    createGuestIfMissing: false,
  });

  if (!owner) {
    return NextResponse.json(
      { error: "Your cart is empty." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const { order, deduplicated } = await createTransactionalOrder(
      {
        cartOwner: owner,
        userId: user?.id ?? null,
        customerEmail: parsed.data.customerEmail,
        customerName: parsed.data.customerName,
        idempotencyKey: parsed.data.idempotencyKey,
        paymentProvider,
        shippingAddress: parsed.data.shippingAddress,
        notes: parsed.data.notes,
      },
      db,
    );

    if (!deduplicated) {
      await sendOrderReceiptEmail(
        {
          toEmail: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          totalPaise: order.totalPaise,
          isDemoOrder: order.isDemoOrder,
          paymentStatus: order.paymentStatus,
        },
        db,
      );
    }

    if (paymentProvider === "razorpay" && !order.providerOrderId) {
      const rzp = await createRazorpayOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountPaise: order.totalPaise,
      });
      await db
        .update(orders)
        .set({ providerOrderId: rzp.providerOrderId })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        ok: true,
        mode: "razorpay",
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPaise: order.totalPaise,
        razorpay: rzp,
      });
    }

    if (paymentProvider === "stripe" && !order.providerOrderId) {
      const stripeSession = await createStripeCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        totalPaise: order.totalPaise,
      });
      await db
        .update(orders)
        .set({ providerOrderId: stripeSession.providerOrderId })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        ok: true,
        mode: "stripe",
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPaise: order.totalPaise,
        checkoutUrl: stripeSession.checkoutUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "demo",
      deduplicated,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus, // DEMO_ORDER
      paymentStatus: order.paymentStatus, // DEMO_NON_CHARGING (never PAID)
      totalPaise: order.totalPaise,
    });
  } catch (err) {
    if (err instanceof OrderDomainError) {
      const status =
        err.code === "OUT_OF_STOCK" ||
        err.code === "SKU_COMPLIANCE_BLOCKED" ||
        err.code === "COUPON_INVALID"
          ? 422
          : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    return NextResponse.json(
      { error: "Unable to complete checkout." },
      { status: 500 },
    );
  }
}
