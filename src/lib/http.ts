import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSignedGuestToken,
  GUEST_CART_COOKIE_NAME,
  resolveSessionUser,
  SESSION_COOKIE_NAME,
  verifySameOriginRequest,
  verifySignedGuestToken,
  type AuthenticatedUser,
} from "@/domain/auth/session";
import type { CartOwner } from "@/domain/cart/service";

export function extractClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "local-client";
}

export function assertSameOriginOrJson403(
  request: Request,
): NextResponse | null {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 },
    );
  }
  return null;
}

export async function resolveRequestCartOwner(options?: {
  createGuestIfMissing?: boolean;
}): Promise<{
  user: AuthenticatedUser | null;
  owner: CartOwner | null;
  newGuestCookieValue: string | null;
}> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await resolveSessionUser(rawSession);

  if (user) {
    return {
      user,
      owner: { userId: user.id },
      newGuestCookieValue: null,
    };
  }

  const rawGuest = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  const verifiedGuest = verifySignedGuestToken(rawGuest);
  if (verifiedGuest) {
    return {
      user: null,
      owner: { guestTokenHash: verifiedGuest.tokenHash },
      newGuestCookieValue: null,
    };
  }

  if (options?.createGuestIfMissing) {
    const minted = createSignedGuestToken();
    return {
      user: null,
      owner: { guestTokenHash: minted.tokenHash },
      newGuestCookieValue: minted.cookieValue,
    };
  }

  return { user: null, owner: null, newGuestCookieValue: null };
}

export function attachGuestCartCookie(
  response: NextResponse,
  cookieValue: string | null,
): NextResponse {
  if (!cookieValue) return response;
  response.cookies.set(GUEST_CART_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
