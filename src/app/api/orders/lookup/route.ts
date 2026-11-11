import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema/commerce";
import { checkRateLimit } from "@/domain/auth/session";
import { assertSameOriginOrJson403, extractClientKey } from "@/lib/http";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  orderNumber: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
});

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const limit = await checkRateLimit(
    "order_lookup",
    extractClientKey(request),
    20,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many lookup attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter both a valid order number and receipt email address." },
      { status: 400 },
    );
  }

  const normalizedOrderNo = parsed.data.orderNumber.toUpperCase();
  const normalizedEmail = parsed.data.email.toLowerCase();

  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, normalizedOrderNo),
        eq(orders.customerEmail, normalizedEmail),
      ),
    );

  if (!order) {
    return NextResponse.json(
      { error: "No order matched that order number and email combination." },
      { status: 404 },
    );
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      isDemoOrder: order.isDemoOrder,
      subtotalPaise: order.subtotalPaise,
      discountPaise: order.discountPaise,
      shippingPaise: order.shippingPaise,
      taxablePaise: order.taxablePaise,
      cgstPaise: order.cgstPaise,
      sgstPaise: order.sgstPaise,
      igstPaise: order.igstPaise,
      totalPaise: order.totalPaise,
      destinationCity: order.shippingAddressJson.city,
      destinationStateCode: order.shippingAddressJson.stateCode,
      destinationPinCode: order.shippingAddressJson.pinCode,
      createdAt: order.createdAt.toISOString(),
      items: items.map((i) => ({
        id: i.id,
        sku: i.sku,
        productSlug: i.productSlug,
        productName: i.productName,
        variantTitle: i.variantTitle,
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate,
        quantity: i.quantity,
        lineTotalPaise: i.lineTotalPaise,
      })),
    },
  });
}
