import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyCouponToCart,
  CartDomainError,
  getHydratedCart,
  setCartItemQuantity,
} from "@/domain/cart/service";
import { computeOrderPricing } from "@/domain/pricing/totals";
import {
  assertSameOriginOrJson403,
  attachGuestCartCookie,
  resolveRequestCartOwner,
} from "@/lib/http";

export const dynamic = "force-dynamic";

const mutateItemSchema = z.union([
  z.object({
    variantId: z.string().min(1).max(80),
    quantity: z.number().int().min(0).max(12),
    mode: z.enum(["increment", "set"]).default("increment"),
  }),
  z.object({
    items: z
      .array(
        z.object({
          variantId: z.string().min(1).max(80),
          quantity: z.number().int().min(1).max(12).default(1),
        }),
      )
      .min(1)
      .max(10),
  }),
]);

const couponSchema = z.object({
  couponCode: z.string().trim().max(40).nullable(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stateCode = url.searchParams.get("stateCode") ?? undefined;
  const { owner } = await resolveRequestCartOwner({ createGuestIfMissing: false });

  if (!owner) {
    return NextResponse.json({
      cartId: null,
      items: [],
      totalItemCount: 0,
      appliedCouponCode: null,
      couponDescription: null,
      couponMessage: null,
      pricing: computeOrderPricing([], 0, {
        freeShippingThresholdPaise: 99900,
        standardShippingPaise: 7900,
        dispatchStateCode: "MH",
        destinationStateCode: stateCode,
      }),
    });
  }

  const cart = await getHydratedCart(owner, stateCode);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const parsed = mutateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cart item payload." },
      { status: 400 },
    );
  }

  const { owner, newGuestCookieValue } = await resolveRequestCartOwner({
    createGuestIfMissing: true,
  });

  try {
    let view;
    if ("items" in parsed.data) {
      for (const item of parsed.data.items) {
        view = await setCartItemQuantity(
          owner!,
          item.variantId,
          item.quantity,
          "increment",
        );
      }
    } else {
      view = await setCartItemQuantity(
        owner!,
        parsed.data.variantId,
        parsed.data.quantity,
        parsed.data.mode,
      );
    }

    const res = NextResponse.json(view);
    return attachGuestCartCookie(res, newGuestCookieValue);
  } catch (err) {
    if (err instanceof CartDomainError) {
      const status =
        err.code === "SKU_COMPLIANCE_BLOCKED" || err.code === "INSUFFICIENT_STOCK"
          ? 422
          : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    return NextResponse.json(
      { error: "Unable to update cart." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const csrf = assertSameOriginOrJson403(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coupon request." },
      { status: 400 },
    );
  }

  const { owner, newGuestCookieValue } = await resolveRequestCartOwner({
    createGuestIfMissing: true,
  });

  try {
    const view = await applyCouponToCart(owner!, parsed.data.couponCode);
    const res = NextResponse.json(view);
    return attachGuestCartCookie(res, newGuestCookieValue);
  } catch (err) {
    if (err instanceof CartDomainError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Unable to apply coupon." },
      { status: 500 },
    );
  }
}
